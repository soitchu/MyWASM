
#include <stdio.h>
#include <time.h>
#include <stdlib.h>

// Merge two subarrays L and M into arr
void merge(int arr[], int p, int q, int r, int* L, int* M) {

  // Create L ← A[p..q] and M ← A[q+1..r]
  int n1 = q - p + 1;
  int n2 = r - q;

  for (int i = 0; i < n1; i++)
    L[i] = arr[p + i];
  for (int j = 0; j < n2; j++)
    M[j] = arr[q + 1 + j];

  // Maintain current index of sub-arrays and main array
  int i, j, k;
  i = 0;
  j = 0;
  k = p;

  // Until we reach either end of either L or M, pick larger among
  // elements L and M and place them in the correct position at A[p..r]
  while (i < n1 && j < n2) {
    if (L[i] <= M[j]) {
      arr[k] = L[i];
      i++;
    } else {
      arr[k] = M[j];
      j++;
    }
    k++;
  }

  // When we run out of elements in either L or M,
  // pick up the remaining elements and put in A[p..r]
  while (i < n1) {
    arr[k] = L[i];
    i++;
    k++;
  }

  while (j < n2) {
    arr[k] = M[j];
    j++;
    k++;
  }
}

// Divide the array into two subarrays, sort them and merge them
void mergeSort(int arr[], int l, int r, int* L, int* M) {
  if (l < r) {

    // m is the point where the array is divided into two subarrays
    int m = l + (r - l) / 2;

    mergeSort(arr, l, m, L, M);
    mergeSort(arr, m + 1, r, L, M);

    // Merge the sorted subarrays
    merge(arr, l, m, r, L, M);
  }
}

// Print the array
void printArray(int arr[], int size) {
  for (int i = 0; i < size; i++)
    printf("%d ", arr[i]);
  printf("\n");
}

// Driver program
int main() {
  int size = 10000000;
  int* arr = malloc(size * sizeof(*arr)); 
  int L[size], M[size];
  
  for(int i = 0; i < size; i = i + 1){
    arr[i] = size - i;
  }


  clock_t begin = clock();
  mergeSort(arr, 0, size - 1, L, M);
  clock_t end = clock();

  double time_spent = (double)(end - begin) / CLOCKS_PER_SEC;
  printf("%f", time_spent);
}