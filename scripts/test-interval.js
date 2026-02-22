
console.log('Start');
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log('Tick', count);
  if (count >= 5) {
    clearInterval(interval);
    console.log('End');
  }
}, 1000);
