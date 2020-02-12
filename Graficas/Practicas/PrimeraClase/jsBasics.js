let a = 5;

console.log(a);

lista = [];

lista.push(a, "asdfasdf", 1, 2, 12341234, "asdf");

console.log(lista);

function suma5(element){
    element += 5;
    console.log(element + 5);
}

lista.forEach(suma5);

for (element of lista){
    console.log(element);
}

lista = [2,4,5,2,1,4,5,8,0,9];
lista.sort((a,b) => a<b)
console.log(lista)

