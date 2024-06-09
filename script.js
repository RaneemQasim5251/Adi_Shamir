const PRIME = 208351617316091241234326746312124448251235562226470491514186331217050270460481n;
const sharesInfo = [
    { name: "Alice", img: "Alice.jpg" },
    { name: "Spiderman", img: "Spiderman.jpg" },
    { name: "Hannibal", img: "Hannibal.jpg" },
    { name: "Alan Turing", img: "AlanTuring.jpg" },
    { name: "Sherlock Holmes", img: "SherlockHolmes.jpg" },
    { name: "Wonder Woman", img: "WonderWoman.jpg" },
    { name: "Batman", img: "Batman.jpg" },
    { name: "Superman", img: "Superman.jpg" },
    { name: "Iron Man", img: "IronMan.jpg" },
    { name: "Hulk", img: "Hulk.jpg" },
    { name: "Captain America", img: "CaptainAmerica.jpg" }
];

function generatePolynomial(secret, degree) {
    const poly = [BigInt(secret)];
    for (let i = 1; i <= degree; i++) {
        poly.push(BigInt(Math.floor(Math.random() * Number(PRIME - 1n))));
    }
    return poly;
}

function evaluatePolynomial(poly, x) {
    let y = 0n;
    for (let i = poly.length - 1; i >= 0; i--) {
        y = (y * x + poly[i]) % PRIME;
    }
    return y;
}

function generateShares() {
    const secret = document.getElementById('secret').value;
    const numShares = parseInt(document.getElementById('numShares').value);
    const threshold = parseInt(document.getElementById('threshold').value);

    if (threshold < 4) {
        alert("Threshold should be 4 or more for accurate reconstruction.");
        return;
    }

    const poly = generatePolynomial(secret, threshold - 1);
    const shares = [];
    for (let i = 1; i <= numShares; i++) {
        shares.push({ x: BigInt(i), y: evaluatePolynomial(poly, BigInt(i)) });
    }

    const sharesDiv = document.getElementById('shares');
    sharesDiv.innerHTML = '';
    shares.forEach((share, index) => {
        const nameInfo = sharesInfo[index % sharesInfo.length];
        const shareContainer = document.createElement('div');
        shareContainer.classList.add('share-container');
        
        const img = document.createElement('img');
        img.src = nameInfo.img;
        shareContainer.appendChild(img);

        const shareText = document.createElement('div');
        shareText.classList.add('share-text');
        shareText.innerText = `${nameInfo.name}: (x: ${share.x}, y: ${share.y})`;
        shareContainer.appendChild(shareText);

        sharesDiv.appendChild(shareContainer);
    });
}

function parseShares(input) {
    const lines = input.trim().split('\n');
    const shares = lines.map(line => {
        const match = line.match(/\(x: (\d+), y: (\d+)\)/);
        return { x: BigInt(match[1]), y: BigInt(match[2]) };
    });
    return shares;
}

function modInverse(a, p) {
    let [m, n] = extendedGCD(a, p);
    return ((m % p) + p) % p;
}

function extendedGCD(a, b) {
    if (b === 0n) return [1n, 0n];
    const [x, y] = extendedGCD(b, a % b);
    return [y, x - (a / b) * y];
}

function reconstructSecret() {
    const input = document.getElementById('sharesInput').value;
    const shares = parseShares(input);

    if (shares.length < 2) {
        alert("At least two shares are needed to reconstruct the secret.");
        return;
    }

    let secret = 0n;
    for (let i = 0; i < shares.length; i++) {
        let { x: xi, y: yi } = shares[i];
        let num = 1n;
        let den = 1n;

        for (let j = 0; j < shares.length; j++) {
            if (i !== j) {
                let { x: xj } = shares[j];
                num = (num * -xj) % PRIME;
                den = (den * (xi - xj)) % PRIME;
            }
        }

        let term = (yi * num * modInverse(den, PRIME)) % PRIME;
        secret = (secret + term) % PRIME;
    }

    if (secret < 0) {
        secret = (secret + PRIME) % PRIME;
    }

    document.getElementById('reconstructedSecret').innerText = secret.toString();
}
