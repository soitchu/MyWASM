const len = 1000000;
const prime_list = new Array(len);

function isPrime(n) {
    if (n <= 1) {
        return false;
    }

    if ((n == 2) || (n == 3)) { 
        return true;
    }

    if ((n % 2) == 0) {
        return false;
    }

    for (let i = 3; (i * i) <= n; i = i + 2) {
        if ((n % i) == 0) {
            return false;
        }
    }

    return true;
}


function main() {
    let count = 0;
    let n = 1;

    while(count < len) {
        if(isPrime(n)) {
            prime_list[count] = n;            
            count = count + 1;
        }

        n = n + 1;
    }
}

const start = performance.now();
console.log(main());
console.log(performance.now() - start);