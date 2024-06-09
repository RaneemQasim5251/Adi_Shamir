const PRIME = 2n ** 127n - 1n;

function textToNumber(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    let number = 0n;
    for (let byte of data) {
        number = number * 256n + BigInt(byte);
    }
    return number;
}

function numberToText(number) {
    let bytes = [];
    while (number > 0n) {
        bytes.push(Number(number % 256n));
        number = number / 256n;
    }
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes.reverse()));
}

function generateShares() {
    const secretText = document.getElementById('secret').value;
    const numberOfShares = parseInt(document.getElementById('shares').value);
    const threshold = parseInt(document.getElementById('threshold').value);
    const secret = textToNumber(secretText);

    if (numberOfShares < threshold) {
        alert("Number of shares must be greater than or equal to the threshold.");
        return;
    }

    const shares = makeRandomShares(secret, threshold, numberOfShares, PRIME);
    displayShares(shares);
}

function makeRandomShares(secret, minimum, shares, prime) {
    const poly = [secret];
    for (let i = 1; i < minimum; i++) {
        poly.push(BigInt(Math.floor(Math.random() * Number(prime))));
    }

    const points = [];
    for (let i = 1; i <= shares; i++) {
        points.push({ x: i, y: evalAt(poly, BigInt(i), prime) });
    }

    return points;
}

function evalAt(poly, x, prime) {
    let accum = 0n;
    for (let coeff of poly.slice().reverse()) {
        accum = (accum * x + coeff) % prime;
    }
    return accum;
}

function displayShares(shares) {
    const shareList = document.getElementById('share-list');
    shareList.innerHTML = '';
    shares.forEach(share => {
        const listItem = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = `(x: ${share.x}, y: ${share.y})`;
        listItem.appendChild(text);
        shareList.appendChild(listItem);
    });
}

function decodeShares() {
    try {
        const sharesInput = document.getElementById('shares-input').value.trim().split('\n');
        const shares = sharesInput.map(share => {
            const matches = share.match(/x:\s*(\d+),\s*y:\s*(\d+)/);
            if (matches) {
                const [_, x, y] = matches;
                return { x: BigInt(x), y: BigInt(y) };
            } else {
                throw new Error("Invalid share format");
            }
        });

        console.log("Shares for reconstruction:", shares);
        const secret = recoverSecret(shares, PRIME);
        console.log("Recovered secret (number):", secret);
        const reconstructedSecret = numberToText(secret);
        console.log("Reconstructed secret (text):", reconstructedSecret);
        document.getElementById('reconstructed-secret').textContent = reconstructedSecret;
    } catch (error) {
        console.error("Error during decoding:", error);
        alert("Failed to reconstruct secret. Please check the share format.");
    }
}

function recoverSecret(shares, prime) {
    const x_s = shares.map(share => BigInt(share.x));
    const y_s = shares.map(share => share.y);
    return lagrangeInterpolate(0n, x_s, y_s, prime);
}

function lagrangeInterpolate(x, x_s, y_s, p) {
    const k = x_s.length;
    let PI = vals => vals.reduce((acc, val) => acc * val % p, 1n);

    let nums = [], dens = [];
    for (let i = 0; i < k; i++) {
        let others = x_s.slice();
        let cur = others.splice(i, 1)[0];
        nums.push(PI(others.map(val => x - val)));
        dens.push(PI(others.map(val => cur - val)));
    }

    let den = PI(dens);
    let num = nums.reduce((acc, n, i) => (acc + y_s[i] * n * divmod(dens[i], p)) % p, 0n);

    return (num * divmod(den, p) + p) % p;
}

function divmod(num, den, p) {
    return num * extendedGcd(den, p)[0] % p;
}

function extendedGcd(a, b) {
    let x = 0n, y = 1n, u = 1n, v = 0n;
    while (a !== 0n) {
        let q = b / a;
        let r = b % a;
        let m = x - u * q;
        let n = y - v * q;
        b = a;
        a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }
    return [x, y];
}
