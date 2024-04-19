import time

def isPrime(n):
    if n <= 1:
        return False;

    if ((n == 2) or (n == 3)): 
        return True;

    if ((n % 2) == 0):
        return False;
    
    i = 3

    while(i * i <= n):
        if ((n % i) == 0):
            return False;

        i = i + 2

    return True;


def main():
    len = 1000000
    prime_list = [None] * len
    count = 0;
    n = 1;

    while(count < len):
        if(isPrime(n)):
            prime_list[count] = n;            
            count = count + 1;
        n = n + 1;

start = time.time()
main()
print(time.time() - start)