
#include <stdbool.h>
#include <ctime>
#include <cstdio>


bool isPrime(int n) {
    if (n <= 1) {
        return false;
    }

    if ((n == 2) || (n == 3)) { 
        return true;
    }

    if ((n % 2) == 0) {
        return false;
    }

    for (int i = 3; (i * i) <= n; i = i + 2) {
        if ((n % i) == 0) {
            return false;
        }
    }

    return true;
}


int main() {
    clock_t begin = clock();
    int len = 1000000;
    int prime_list[len];
    int count = 0;
    int n = 1;

    while(count < len) {
        if(isPrime(n)) {
            prime_list[count] = n;            
            count = count + 1;
        }

        n = n + 1;
    }

    clock_t end = clock();
    double time_spent = (double)(end - begin) / CLOCKS_PER_SEC;
    printf("%f", time_spent);
}