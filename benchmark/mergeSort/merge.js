function merge(arr, p, q, r, L, M) {
  const n1 = q - (p - 1);
  const n2 = r - q;

  for (let i = 0; i < n1; i = i + 1) {
    L[i] = arr[p + i];
  }

  for (let j = 0; j < n2; j = j + 1) {
    M[j] = arr[q + 1 + j];
  }

  // console.log(L, M, arr[q + 1 + 0], q);


  let i = 0;
  let j = 0;
  let k = p;

  while (i < n1 && j < n2) {
    if (L[i] <= M[j]) {
      arr[k] = L[i];
      i = i + 1;
    } else {
      arr[k] = M[j];
      j = j + 1;
    }
    k = k + 1;
  }

  while (i < n1) {
    arr[k] = L[i];
    i = i + 1;
    k = k + 1;
  }

  while (j < n2) {
    arr[k] = M[j];
    j = j + 1;
    k = k + 1;
  }
}

function mergeSort(arr, l, r, L, M) {
  if (l < r) {
    const m = (l + (r - l) / 2) | 0;

    mergeSort(arr, l, m, L, M);
    mergeSort(arr, m + 1, r, L, M);

    merge(arr, l, m, r, L, M);
  }
}

function main() {
  const size = 10000000;
  const arr = new Uint32Array(size);
  const L = new Uint32Array(size);
  const M = new Uint32Array(size);

  for (let i = 0; i < size; i = i + 1) {
    arr[i] = size - i;
  }

  const start = performance.now();
  mergeSort(arr, 0, size - 1, L, M);
  console.log(performance.now() - start);

}

main();