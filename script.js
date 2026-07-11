const categories = [

"الكل",

"تخسيس",

"ملينات",

"مكملات جنسية",

"فيتامينات",

"اعشاب"

];

const container=document.getElementById("categories");

categories.forEach(cat=>{

const div=document.createElement("div");

div.className="category";

div.innerText=cat;

container.appendChild(div);

});
