//Almost all algorithms implemented here are brute-forced.
//For the "real algorithms", see the project page or the paper

/*
NodeRecord
*/
class NodeRecord {
  constructor(key) {
    this.key = key;
    this.parent = null;
    this.children = [];
    this.active = null;
    this.loss = 0;
    this.rank = 0;
  }

  jsonFy() {
    let map = {};
    map["key"] = this.key;
    map["children"] = [];
    map["active"] = this.active;
    map["node"] = this;
   for (let c of this.children) {
      map["children"].push(c.jsonFy());
    }
    return map;
  }

  getHeight() {

    if (!this.children)
      return 1;

    let ma = 0;
    for (let c of this.children) {
      ma = Math.max(ma, c.getHeight());
    }

    return 1 + ma;
  }

  isPassiveLinkable() {
    if (this.active && this.active.flag)
      return false;

    for (let c of this.children) {
      if (!c.isPassiveLinkable())
        return false;
    }
    return true;
  }

  isActive() {
    return (this.active && this.active.flag);
  }

  isPassive() {
    return !this.isActive();
  }

  isActiveRoot() {
    return (this.parent && this.parent.isPassive() && this.isActive());
  }

  firstPassiveChildIndex() {
      let i;
      for (i = 0; i < this.children.length; i++) {
        if (this.children[i].isPassive())
          return i;
      }
      return i;
  }

  updateActiveRoot(map) {
    if (this.isActiveRoot()) {
      if(!map[this.rank]) {
       map[this.rank] = [];
      }
      map[this.rank].push(this);
    } 

    for (let c of this.children) {
      c.updateActiveRoot(map);
    }
  }

  updateActiveNode(map) {
    if (this.isActive()) {
      if(!map[this.rank]) {
       map[this.rank] = [];
      }
      map[this.rank].push(this);
    } 

    for (let c of this.children) {
      c.updateActiveNode(map);
    }
  }

  getActiveLossTwo() {
    if (this.isActive() && this.loss == 2) {
      return this;
    }

    for (let c of this.children) {
      if (c.getActiveLossTwo() != null)
        return c;
    }

    return null;
  }


  findNode(v) {
    if (this == v) {
      return this;
    }

    for (let c of this.children) {
      if (c.findNode(v) != null) {
          return c;
      }
    }

    return null;
  }
}



/*
ActiveRecord
*/

class ActiveRecord {
  constructor() {
    this.flag = true;
  }
}


/*
NodeRecord
*/
class HeapRecord {
  constructor() {
    this.root = null;
    this.size = 0;
    this.active = new ActiveRecord();
    this.nonLinkable = [];
    this.head = [];
    this.rankList = {};
    this.lossList = {};
  }


  rootJson() {
    if (this.root)
      return this.root.jsonFy();

    return null;
  }

  headJson(i) {

    if (this.head.length == 0)
      return null;

    let map = {};
    map["key"] = this.head[i].key;
    map["active"] = this.head[i].active;
    map["children"] = [];

    if (i == this.head.length - 1) {
        return map;
    }

    map["children"].push(this.headJson(i+1));

    return map;
  }

  fixListJson(i) {

  }


  findNode(v) {
      return this.root.findNode(v);
  }


  rootDegreeReduction() {

    if (this.root.children.length < 3)
      return false;
    let n = this.root.children.length;
    let x = this.root.children[n-1];
    let y = this.root.children[n-2];
    let z = this.root.children[n-3];

    if (!x.isPassiveLinkable() || !y.isPassiveLinkable() || !z.isPassiveLinkable()) 
      return false;
    

    let arr = [x,y,z].sort(function(a,b) { return a.key - b.key; });
    x = arr[0];
    y = arr[1];
    z = arr[2];

    addP("...<b>RootDegreeReduction</b> on node <b>" + x.key + "</b>, <b>" +y.key +"</b>, and <b>"+z.key+"</b>")
    this.root.children.pop();
    this.root.children.pop();
    this.root.children.pop();

    x.active = this.active;
    y.active = this.active;


    y.children.push(z);
    z.parent = y;

    x.children.unshift(y);
    y.parent = x;

    this.root.children.unshift(x);

    x.loss = 0;
    y.loss = 0;

    x.rank = 1;
    y.rank = 0;
    return true;
  }

  ActiveRootReduction() {

    let map = {};
    this.root.updateActiveRoot(map);

    let stop = false;

    let self = this;
    Object.keys(map).forEach(function(key) {

      if (map[key].length >= 2 && !stop) {

        let x = map[key][0];
        let y = map[key][1];

        addP("...<b>ActiveRootReduction</b> on node <b>" + x.key + "</b> and <b>" +y.key +"</b> , both have rank <b>" +
           + x.rank + "</b>")

        if (x.key > y.key) {
          x = map[key][1];
          y = map[key][0];
        }
        

        y.parent.children.splice(y.parent.children.indexOf(y), 1);

        y.parent = x;
        x.children.unshift(y);
        x.rank++;
        let z = x.children[x.children.length - 1];

        if (z.isPassive()) {
          let index = self.root.firstPassiveChildIndex();
          self.root.children.splice(index, 0, z);
          z.parent = self.root;
          x.children.pop();
        }

        stop = true;

      }

    })

    return stop;

  }

  oneNodeLossReduction() {
    let x = this.root.getActiveLossTwo();

    if (!x)
      return false;

    addP("...<b>OneNodeLossReduction</b> on node <b>" + x.key + " </b> with loss = <b>" + x.loss +"</b>");

    let y = x.parent;

    this.root.children.unshift(x);
    x.parent = this.root;
    x.loss = 0;

    if(y.isActive()) {
       y.rank--;
       if (!y.isActiveRoot())
          y.loss++;
    }



    return true;
  }

  twoNodeLossReduction() {
    let map = {};
    this.root.updateActiveNode(map);

    let stop = false;

    Object.keys(map).forEach(function(key) {
      let x = null;
      let y = null;

      for (let c of map[key]) {
        if (c.loss == 1) {
          if (x)
            y = c;
          else
            x = c;
        }
      }

      if(x && y && !stop) {
        stop = true;
        if (x.key > y.key) {
          let t = x;
          x = y;
          y = t;
        }

        addP("...<b>TwoNodeLossReduction</b> on node <b>" + x.key + " </b> and node <b>" + y.key +"</b>");
          
          let z = y.parent;

          x.children.unshift(y);
          y.parent = x;

          x.rank++;
          x.loss = 0;
          y.loss = 0;

          z.children.splice(z.children.indexOf(y), 1);

          if (z.isActive()) {
              z.rank--;
              if (z.isActiveRoot()) {
                  z.loss++;
              }
          }
        }
      })
  }
}

/*
Globals
*/

 let margin = {top: 20, right: 20, bottom: 20, left: 20};
 let width = 1200;
 let height = 500;
 let bodyWidth = width / 3;
 let target = null;
 let arr1 = [];
 let arr2 = [];

 let body = d3.select("#body")
      .attr("width", width)
      .attr("height", height);



  body.append("line")
    .attr("class", "zero")
    .attr("stroke-dasharray", "5,5")
    .attr("x1", bodyWidth)
    .attr("y1", 0)
    .attr("x2", bodyWidth)
    .attr("y2", height)


  body.append("line")
    .attr("class", "zero")
    .attr("stroke-dasharray", "5,5")
    .attr("x1", bodyWidth * 2)
    .attr("y1", 0)
    .attr("x2", bodyWidth * 2)
    .attr("y2", height)


  let l1 = body.append("text")             
      .attr("transform",
          "translate(" + 2 + " ,"  + (height - 2) + ")")
    .style("text-anchor", "left")
    .style("font", "12px times")
    .style("font-weight", "bold")
    .text("H1");

  let l2 = body.append("text")             
      .attr("transform",
          "translate(" + (bodyWidth * 2 + 2) + " ,"  + (height - 2) + ")")
    .style("text-anchor", "left")
    .style("font", "12px times")
    .style("font-weight", "bold")
    .text("H2");

  let lt = body.append("text")             
      .attr("transform",
          "translate(" + (bodyWidth + 2) + " ,"  + (height - 2) + ")")
    .style("text-anchor", "left")
    .style("font", "12px times")
    .style("font-weight", "bold")
    .text("Old H?");


let g1 = body
        .append("g")
        .attr("transform", function(d) { 
                  return "translate(" + (margin.left) + "," + (margin.top) + ")"; })
let gt = body
          .append("g")
          .attr("transform", function(d) { 
                  return "translate(" + (bodyWidth + margin.left) + "," + (margin.top) + ")"; })
let g2 = body
        .append("g")
        .attr("transform", function(d) { 
                  return "translate(" + (bodyWidth * 2 + margin.left) + "," + (margin.top) + ")"; })

let h1 = new HeapRecord();
let ht = new HeapRecord();
let h2 = new HeapRecord();

/*
 Main callback functions
*/

function randomInsertOne() {

  clearP();
  let num = parseInt(document.getElementById("randomKey").value);
  if (isNaN(num)) {
    addP("Inavlid Random Insertion")
    return;
  }
  ht = h1;
  clear(gt);
  lt.text("Old H1");
  draw(gt, ht);
  
  arr1 = [];

  while(arr1.length < num){
      let r = Math.floor(Math.random()*num + arr2.length);
      if(arr1.indexOf(r) === -1) 
        arr1.push(r);
  }
  addP("Insert <b>" + num + "</b> random nodes")

  
  h1 = new HeapRecord();
  for (let v of arr1){
    addP("Insert <b>" + v + "</b>")
    h1 = insert(h1, v);
    clear(g1);
    draw(g1, h1);
  }
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
  lt.text("Old H2");
  draw(gt, ht);
  
  arr2 = [];

  while(arr2.length < num){
      let r = Math.floor(Math.random()*num + arr1.length);
      if(arr2.indexOf(r) === -1) 
        arr2.push(r);
  }
  addP("Insert <b>" + num + "</b> random nodes")

  
  h2 = new HeapRecord();
  for (let v of arr2){
    addP("Insert <b>" + v + "</b>")
    h2 = insert(h2, v);
    clear(g2);
    draw(g2, h2);
  }
}

function insertOne() {
  clearP();

  let v = parseInt(document.getElementById("key").value);

  if (isNaN(v)) {
    addP("Inavlid Insertion")
    return;
  }

  ht = h1;
  clear(gt);
  lt.text("Old H1");
  draw(gt, ht);
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
  lt.text("Old H2");
  draw(gt, ht);
  addP("Insert " + v);
  h2 = insert(h2, v);
  clear(g2);
  draw(g2, h2);
}

function mergeTwo() {
  clearP();
  ht = h1;
  clear(gt);
  lt.text("Old H1");
  draw(gt, ht);

  addP("Merge H1 and H2");
  h1 = merge(h1, h2);
  h2 = new HeapRecord();
  clear(g1);
  draw(g1, h1);
}

function deleteMinOne() {
  clearP();
  if (h1.root == null) {
    addP("Invalid Delete Min")
    return;
  }
  ht = h1;
  clear(gt);
  lt.text("Old H1");
  draw(gt, ht);

  addP("Delete the root/min <b>" + h1.root.key + "</b>");
  h1 = deleteMin(h1);
  clear(g1);
  draw(g1, h1);
}

function deleteMinTwo() {
  clearP();

  if (h2.root == null) {
    addP("Invalid Delete Min")
    return;
  }

  ht = h2;
  clear(gt);
  lt.text("Old H2");
  draw(gt, ht);
  
  addP("Delete the root/min <b>" + h2.root.key + "</b>");
  h2 = deleteMin(h2);
  clear(g2);
  draw(g2, h2);
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
      clear(gt);
      lt.text("Old H1");
      draw(gt, ht);

      addP("Decrease key <b>" + target.key + "</b> to <b>" + v + "</b>");
      h1 = decreaseKey(h1, v);
      clear(g1);
      draw(g1, h1);
  } else if (h2.findNode(target)) {
      ht = h2;
      clear(gt);
      lt.text("Old H2");
      draw(gt, ht);

      addP("Decrease key <b>" + target.key + "</b> to <b>" + v + "</b>");
      h2 = decreaseKey(h2, v);
      clear(g2);
      draw(g2, h1);
  } else {
    addP("invalid decrease key");
  }

 
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



  if (x.isActive()) {
    h.root.children.unshift(x);
    if (y.isActive()) {
      y.rank--;
      if (!y.isActiveRoot()){
      y.loss++;
      }
    }
    x.loss = 0;
  } else if (x.isPassiveLinkable()) {
    h.root.children.push(x);
  }
   else {
    let index = h.root.firstPassiveChildIndex();
    h.root.children.splice(index, 0, x);
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


  let i = minNode.firstPassiveChildIndex();
  for (let c of h.root.children) {
    if (c != minNode) {
      addP("...Link <b>" + c.key + "</b> to the root");
      if (c.isActive()) {
        minNode.children.unshift(c);
      } else if (c.isPassiveLinkable()) {
        minNode.children.push(c);
      }
      else {
        minNode.children.splice(i, 0, c);
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
    for(let k = c.children.length -1; k >= Math.max(0, c.children.length-2); k--) {
        if (c.children[k].isPassive()) {
          addP("......Link the rightmost child of " + c.key + "</b> : <b> " + c.children[k].key +"</b> to the root");
          minNode.children.splice(i, 0, c.children[k]);
          c.children[k].parent = minNode;
          c.children.pop();
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


   if(smallRootHeap.rootDegreeReduction()) {
       smallRootHeap.ActiveRootReduction();
   }
   if(smallRootHeap.ActiveRootReduction()) {
      smallRootHeap.rootDegreeReduction();
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
  let fixList = h.fixListJson(0);
  let data = h.rootJson();

  let offset = 0.05;


 if(queue) {
      let list = d3.tree()
                    .size([height*offset  - margin.top - margin.bottom, bodyWidth - margin.left-margin.right]);

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
          .attr("r", 7)
          .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })


        queueNode.append("text")
          .attr("dy", ".35em")
          .attr("x", function(d){ return d.y})
          .attr("y", function(d){return d.x})
          .style("text-anchor", "middle")
          .style("font", "12px times")
          .text(function(d){return d.data.key});  

    }

    if (fixList) {

          let list = d3.tree()
                        .size([height*offset  - margin.top - margin.bottom, bodyWidth - margin.left-margin.right]);

          let queueNodes = d3.hierarchy(fixList, function(d) {
                return d.children;
          });

          queueNodes = list(queueNodes);


          g.selectAll(".fixListLink")
              .data(queueNodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "fixListLink")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height *offset ) + ")"; })
              .attr("d", function(d) {
                return "M" + d.y + "," + d.x + "L" + d.parent.y +"," + d.parent.x;
               
          });


          let queueNode = g.selectAll(".queueNode")
              .data(queueNodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * offset ) + ")"; });


            queueNode.append("circle")
              .attr("class", "queueNode")
              .attr("transform", function(d) { 
                return "translate(" + d.y + "," + d.x + ")"; })
              .attr("r", 15)
              .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })


            queueNode.append("text")
              .attr("dy", ".35em")
              .attr("x", function(d){ return d.y})
              .attr("y", function(d){return d.x})
              .style("text-anchor", "middle")
              .style("font", "24px times")
              .text(function(d){return d.data.key}); 



        }
        if (data) {
   
          let tree = d3.tree()
                        .size([bodyWidth - margin.left-margin.right, height * h.root.getHeight()/10 - margin.top - margin.bottom]);

           let nodes = d3.hierarchy(data, function(d) {
                return d.children;
            });

           nodes = tree(nodes);



            g.selectAll(".link")
              .data( nodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "link")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * (offset*2)  ) + ")"; })
              .attr("d", function(d) {
                return "M" + d.x + "," + d.y + "L" + d.parent.x +"," + d.parent.y;
             });


            let node = g.selectAll(".node")
              .data(nodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                          return "translate(" + 0 + "," + (height * offset * 2) + ")"; })


              var div = d3.select("body").append("div") 
                .attr("class", "tooltip")       
                .style("opacity", 0)
                

            node.append("circle")
              .attr("class", "node")
              .attr("transform", function(d) { 
                return "translate(" + d.x + "," + d.y + ")"; })
              .attr("r", 15)
              .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })
              .on("mouseover", function(d) {   

                    div.style("opacity", .9)
                        .style("font", "12px Arial")
                        .html("rank: " +d.data.node.rank +"<br/>"  + "loss: " + d.data.node.loss)  
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
                            .html("rank: " +d.data.node.rank +"<br/>"  + "loss: " + d.data.node.loss)  
                            .style("left", (d3.event.pageX) + "px")   
                            .style("top", (d3.event.pageY) + "px");  
                        })          
                  .on("mouseout", function(d) {   
                        div.style("opacity", 0); 
                });

           
            node.on("click", function(elm) {

              node.selectAll("circle")
                .attr("r", 15);

              node.selectAll("circle")
                  .select( function(d) { 
                    if (d===elm){
                        target = elm.data.node;
                      return this;
                    }
                    return null;
                  })
                  .transition()                  
                  .attr("r", 20);
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
