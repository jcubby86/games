const foods = [
  'apple',
  'biscuit',
  'carrot',
  'danish',
  'eclair',
  'chocolate',
  'cheese'
];
const animals = [
  'aphid',
  'cat',
  'dog',
  'monkey',
  'shrimp',
  'zebra',
  'flamingo'
];
const objects = [
  'frost',
  'mug',
  'clip',
  'paper',
  'desk',
  'pine',
  'ring',
  'tree',
  'oak',
  'cable'
];
const places = [
  'saloon',
  'bed',
  'car',
  'desert',
  'ocean',
  'town',
  'chapel',
  'beach'
];
const verbs = [
  'stand',
  'sit',
  'wash',
  'push',
  'read',
  'grow',
  'eat',
  'think',
  'invent',
  'join',
  'goto'
];
const adjectives = [
  'dirty',
  'clean',
  'heavy',
  'soft',
  'shiny',
  'blue',
  'red',
  'green',
  'yellow',
  'purple',
  'limp',
  'funky'
];

function randomNumber(limit: number) {
  return Math.floor(Math.random() * limit);
}
function randomElement<Type>(arr: Type[]) {
  return arr[randomNumber(arr.length)];
}
function getSubjectArr() {
  return randomElement([objects, places, animals, foods]);
}
function generateNickname() {
  const index = randomNumber(3);
  let myArr;

  if (index === 0) {
    myArr = [verbs, adjectives, getSubjectArr()];
  } else {
    myArr = [getSubjectArr(), verbs, getSubjectArr()];
  }

  return myArr.map((x) => randomElement(x)).join('-');
}

export default generateNickname;
