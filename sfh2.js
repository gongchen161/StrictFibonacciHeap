//Almost all algorithms implemented here are brute-forced.
//For the "real algorithms", see the project page or the paper

/*
Globals
*/

 let margin = {top: 20, right: 20, bottom: 20, left: 20};
 let width = 500;
 let height = 500;
 let bodyWidth = width;
 let target = null;
 let arr1 = [];

 let body = d3.select("#body")
      .attr("width", width)
      .attr("height", height);



let g1 = body
        .append("g")
        .attr("transform", function(d) { 
                  return "translate(" + (margin.left) + "," + (margin.top) + ")"; })

let h1 = new HeapRecord();

/*
 Main callback functions
*/


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function randomInsertOne() {

  clearP();
  let num = parseInt(document.getElementById("randomKey").value);
  if (isNaN(num)) {
    addP("Inavlid Random Insertion")
    return;
  }
  ht = h1;


  
  arr1 = [];
  let val = 0;
  while(arr1.length < num){
    arr1.push(val++);
  }
  shuffle(arr1);
  addP("Insert <b>" + num + "</b> random nodes")

  
  h1 = new HeapRecord();
  for (let v of arr1){
    addP("Insert <b>" + v + "</b>")
    h1 = insert(h1, v);
  }
  clear(g1);
  draw(g1, h1);
}

function randomInsertTwo() {

  clearP();
  let num = parseInt(document.getElementById("randomKey").value);
  if (isNaN(num)) {
    addP("Inavlid Random Insertion")
    return;
  }

  ht = h2;
  clear(gt);

  draw(gt, ht);
  
  arr2 = [];

  let val = arr1.length;;
  while(arr2.length < num){
    arr2.push(val++);
  }
  shuffle(arr2);
  addP("Insert <b>" + num + "</b> random nodes")

  
  h2 = new HeapRecord();
  for (let v of arr2){
    addP("Insert <b>" + v + "</b>")
    h2 = insert(h2, v);
  }
  clear(g2);
  draw(g2, h2);
}

function insertOne() {
  clearP();

  let v = parseInt(document.getElementById("key").value);

  if (isNaN(v)) {
    addP("Inavlid Insertion")
    return;
  }

  ht = h1;



  addP("Insert " + v);
  h1 = insert(h1, v);
  clear(g1);
  draw(g1, h1);

}

function insertTwo() {
  clearP();

  let v = parseInt(document.getElementById("key").value);

  if (isNaN(v)) {
    addP("Inavlid Insertion")
    return;
  }
  ht = h2;
  clear(gt);

  draw(gt, ht);
  addP("Insert " + v);
  h2 = insert(h2, v);
  clear(g2);
  draw(g2, h2);
}



function deleteMinOne() {
  clearP();
  if (h1.root == null) {
    addP("Invalid Delete Min")
    return;
  }
  ht = h1;

  addP("Delete the root/min <b>" + h1.root.key + "</b>");
  h1 = deleteMin(h1);
  clear(g1);
  draw(g1, h1);
}


function decrease() {
  clearP();
  let v = parseInt(document.getElementById("dkey").value);

  if (target == null || isNaN(v)){
      addP("Invalid Decrease Key");
      return;
  }

   if (target.key <= v){
      addP("You should decrease the key");
      return;
  }

  
  if (h1.findNode(target)) {
      ht = h1;




      addP("Decrease key <b>" + target.key + "</b> to <b>" + v + "</b>");
      h1 = decreaseKey(h1, v);
      clear(g1);
      draw(g1, h1);
  } else if (h2.findNode(target)) {
      ht = h2;




      addP("Decrease key <b>" + target.key + "</b> to <b>" + v + "</b>");
      h2 = decreaseKey(h2, v);
      clear(g2);
      draw(g2, h1);
  } else {
    addP("invalid decrease key");
  }

  target = null;
}
/*
Helpers
*/

function decreaseKey(h, v) {

  if (!h.root)
    return h;
  let x = target;

  if (x == h.root) {
    h.root.key = v;
    addP("...Decrease toot to <b>" + v +"</b>");
    return h;
  }


  if (v < h.root.key) {
    x.key = h.root.key;
    h.root.key = v;
    addP("...Swap root <b>" + x.key + "</b> with <b>" + v + "</b>");
  } else {
      x.key = v;
  }

  let y = x.parent;
  y.children.splice(y.children.indexOf(x), 1);
  
  
  x.parent = h.root;

  x.loss = 0;

  if (x.isActive()) {
    h.root.children.unshift(x);
    if (y.isActive()) {
      y.rank--;
    }
    x.loss = 0;
  } else if (x.isPassiveLinkable()) {
    h.root.children.push(x);
  }
   else {
    let index = h.root.firstPassiveChildIndex();
    h.root.children.splice(index, 0, x);
  }

  if (y.isActive() && !y.isActiveRoot()){
      y.loss++;
  }

  addP("...Add the target <b>" + x.key + "</b> to be the children root");

  if(!h.twoNodeLossReduction()) {
    h.oneNodeLossReduction();
  }

  let numA = 6;
  let numR = 4;

  while (true) {
    let stop = true;
    if (numA) {
      if (h.ActiveRootReduction()){
        numA--;
        stop = false
      }
    }

    if (numR) {
      if(h.rootDegreeReduction()) {
        numR--;
        stop = false;
      }
    }

    if(stop)
      break;

  }

  return h;

}

function deleteMin(h) {
   if (!h.root)
    return h;

  let min = 99999;
  let minNode = null;
  for (let c of h.root.children) {
      if (c.key < min) {
        min = c.key;
        minNode = c;
      }
  }

  if (!minNode) {
    h = new HeapRecord();
    return h;
  }

  addP("...Find the new root at <b>" + minNode.key + "</b>");


  for (let c of h.root.children) {
    if (c != minNode) {
      addP("...Link <b>" + c.key + "</b> to the root");
      if (c.isActive()) {
        minNode.children.unshift(c);
      } else if (c.isPassiveLinkable()) {
        minNode.children.push(c);
      }
      else {
        minNode.children.splice(minNode.firstPassiveChildIndex(), 0, c);
      }
    }
      c.parent = minNode;
  }

  h.root = minNode;
  h.head.splice(h.head.indexOf(minNode), 1);
  h.size--;
  h.root.active = null;
  
  for (let j = 0; j < Math.min(2, h.head.length); j++) {

    let c = h.head[0];
    addP("...Move the front node <b>" + c.key + "</b> to the back of the Q");
    h.head.shift();
    h.head.push(c);
    let ct = 2;
    while(ct--){
        let k = c.children.length -1;
        if(k < 0)
          continue;
        if (c.children[k].isPassiveLinkable()) {
          addP("......Link the rightmost child of " + c.key + "</b> : <b> " + c.children[k].key +"</b> to the root");
          minNode.children.push(c.children[k]);
          c.children[k].parent = minNode;
          c.children.pop();
          if (!c.isActiveRoot() && c.isActive()) {
            c.loss++;
          }
        } else if (c.children[k].isPassive()) {
          addP("......Link the rightmost child of " + c.key + "</b> : <b> " + c.children[k].key +"</b> to the root");
          minNode.children.splice(minNode.firstPassiveChildIndex(), 0, c.children[k]);
          c.children[k].parent = minNode;
          c.children.pop();

          if (!c.isActiveRoot() && c.isActive()) {
            c.loss++;
          }

        }
    }
  }

  if(!h.twoNodeLossReduction()) {
    h.oneNodeLossReduction();
  }

  while (h.ActiveRootReduction() || h.rootDegreeReduction()){}

  return h;

}

function insert(h, v) {

    let node = new NodeRecord(v);

    if (h.root == null) {
      h.root = node;
      h.size = 1;
      h.active = new ActiveRecord();
      return h;
    }

    let heap = new HeapRecord();
    heap.root = node;
    heap.size = 1;
    heap.active = new ActiveRecord();

    return merge(h, heap);
}


function merge(x, y) {

  if (x == y)
    return x;


  if (!x.root)
    return y;

  if (!y.root)
    return x;

  let smallSizeHeap = x;
  let largeSizeHeap = y;

  if (x.size > y.size){
    smallSizeHeap = y;
    largeSizeHeap = x;
  }

  smallSizeHeap.active.flag = false;

  addP("...Make all nodes in the tree(smaller size) rooted at <b>" + smallSizeHeap.root.key + "</b> passive");


  let smallRootHeap = x;
  let largeRootHeap = y;

  if (x.root.key > y.root.key) {
    smallRootHeap = y;
    largeRootHeap = x; 
  }

   addP("...Make <b>" + smallRootHeap.root.key + "</b> the new root and attach the tree rooted at <b>" 
      + largeRootHeap.root.key + "</b>"); 

   if (smallRootHeap == smallSizeHeap)
    smallRootHeap.root.children.unshift(largeRootHeap.root);
   else 
    smallRootHeap.root.children.push(largeRootHeap.root);


   largeRootHeap.root.parent = smallRootHeap.root;

   smallRootHeap.size += largeRootHeap.size;

   smallRootHeap.active = largeSizeHeap.active;


   smallSizeHeap.head.push(largeRootHeap.root);
   smallSizeHeap.head = smallSizeHeap.head.concat(largeSizeHeap.head);
   smallRootHeap.head = smallSizeHeap.head;


  let numA = 1;
  let numR = 1;

  while (true) {
    let stop = true;
    if (numA) {
      if (smallRootHeap.ActiveRootReduction()){
        numA--;
        stop = false
      }
    }

    if (numR) {
      if(smallRootHeap.rootDegreeReduction()) {
        numR--;
        stop = false;
      }
    }

    if(stop)
      break;

  }

  
   return smallRootHeap;
}


/*
Drawing functions
*/

function clear(g) {
   g.selectAll("*").remove();
}

function draw(g, h) {

  let queue = h.headJson(0);
  let fixList = h.fixListJson();
  let data = h.rootJson();

  let offset = 0.05;
  let r1 = 25;
  let r2 = 12;

  width = h.root.getWidth() *  r1 * 5;
  height = (h.root.getHeight()) *  r1 * 3 + margin.top * 10 + r2 *4;

  body.attr("width", width)
      .attr("height", height);

 if(queue) {

      let list = d3.tree()
                    .size([height*offset - margin.top * 2, Math.min(queue["length"] * r2 * 5, width) - margin.left * 2]);

      let queueNodes = d3.hierarchy(queue, function(d) {
            return d.children;
      });

      queueNodes = list(queueNodes);


      g.selectAll(".queueLink")
          .data(queueNodes.descendants().slice(1))
          .enter().append("path")
          .attr("class", "queueLink")
          .attr("d", function(d) {
            return "M" + d.y + "," + d.x + "L" + d.parent.y +"," + d.parent.x;
           
      });


      let queueNode = g.selectAll(".queueNode")
          .data(queueNodes.descendants())
          .enter()
          .append("g");


        queueNode.append("circle")
          .attr("class", "queueNode")
          .attr("transform", function(d) { 
            return "translate(" + d.y + "," + d.x + ")"; })
          .attr("r", r2)
          .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })
          .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                        .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss())) 
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY) + "px");  
                    })          
              .on("mouseout", function(d) {   
                    div.style("opacity", 0); 
                });


        queueNode.append("text")
          .attr("dy", ".35em")
          .attr("x", function(d){ return d.y})
          .attr("y", function(d){return d.x})
          .style("text-anchor", "middle")
          .style("font", "12px times")
          .text(function(d){return d.data.key})
          .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                        .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss()))  
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY) + "px");  
                    })          
              .on("mouseout", function(d) {   
                    div.style("opacity", 0); 
                }); 

    }

    if (fixList) {
          console.log(fixList);

          let list = d3.tree()
                        .size([height*offset - margin.bottom * 2, Math.min(fixList["length"] * r2 * 5, width)  - margin.left * 2]);

          let fixNodes = d3.hierarchy(fixList, function(d) {
                return d.children;
          });

          fixNodes = list(fixNodes);


          g.selectAll(".fixLink")
              .data(fixNodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "fixLink")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height *offset ) + ")"; })
              .attr("d", function(d) {
                return "M" + d.y + "," + d.x + "L" + d.parent.y +"," + d.parent.x;
               
          });


          let fixNode = g.selectAll(".fixNode")
              .data(fixNodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * offset) + ")"; });


            fixNode.append("circle")
              .attr("class", "fixNode")
              .attr("transform", function(d) { 
                return "translate(" + d.y + "," + d.x + ")"; })
              .attr("r", r2)
              .attr("fill", function(d){return d.data.color  })
              .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                       .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss()))  
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY) + "px");  
                    })          
              .on("mouseout", function(d) {   
                    div.style("opacity", 0); 
                });


            fixNode.append("text")
               .attr("dy", ".35em")
              .attr("x", function(d){ return d.y})
              .attr("y", function(d){return d.x})
              .style("text-anchor", "middle")
              .style("font", "12px times")
              .text(function(d){return d.data.key}) 
              .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                       .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss()))  
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY) + "px");  
                    })          
              .on("mouseout", function(d) {   
                    div.style("opacity", 0); 
                });



        }
        if (data) {

          let tree = d3.tree()
                        .size([width - margin.left-margin.right, (height - height * (offset*2))  - margin.top*2 - margin.bottom*2]);

           let nodes = d3.hierarchy(data, function(d) {
                return d.children;
            });

           nodes = tree(nodes);



            g.selectAll(".link")
              .data( nodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "link")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + ((height * (offset*2) +margin.top  )) + ")"; })
              .attr("d", function(d) {
                return "M" + d.x + "," + d.y + "L" + d.parent.x +"," + d.parent.y;
             });


            let node = g.selectAll(".node")
              .data(nodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                          return "translate(" + 0 + "," + ((height * offset * 2) +margin.top) + ")"; })


              var div = d3.select("body").append("div") 
                .attr("class", "tooltip")       
                .style("opacity", 0)
                

            node.append("circle")
              .attr("class", "node")
              .attr("transform", function(d) { 
                return "translate(" + d.x + "," + d.y + ")"; })
              .attr("r", r1)
              .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })
              .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                        .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss()))
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY) + "px");  
                    })          
              .on("mouseout", function(d) {   
                    div.style("opacity", 0); 
                });


            node.append("text")
              .attr("dy", ".35em")
              .attr("x", function(d){ return d.x})
              .attr("y", function(d){return d.y})
              .style("text-anchor", "middle")
              .style("font", "24px times")
              .text(function(d){return d.data.key})
              .on("mouseover", function(d) {   
           
                        div.style("opacity", .9)
                            .style("font", "12px Arial")
                           .html("rank: " +d.data.node.getRank() +"<br/>"  + "loss: " + (d.data.node.getLoss()))
                            .style("left", (d3.event.pageX) + "px")   
                            .style("top", (d3.event.pageY) + "px");  
                        })          
                  .on("mouseout", function(d) {   
                        div.style("opacity", 0); 
                });

           
            node.on("click", function(elm) {

              node.selectAll("circle")
                .attr("r", r1);

              node.selectAll("circle")
                  .select( function(d) { 
                    if (d===elm){
                        target = elm.data.node;
                      return this;
                    }
                    return null;
                  })
                  .transition()                  
                  .attr("r", (r1*1.5));
            });

      }          
}

function clearP() {
   var t = document.getElementById("temp");
   t.innerHTML = '';
}

function addP(text){

    var para = document.createElement("p");
    para.innerHTML = text;
    var t = document.getElementById("temp");
    t.appendChild(para);
}
