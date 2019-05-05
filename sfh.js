

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

   for (let c of this.children) {
      map["children"].push(c.jsonFy());
    }
    return map;
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
    if (this.parent && (!this.parent.active || !this.parent.active.flag) && this.active && this.active.flag) {
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
    if (this.active && this.active.flag) {
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
    if (this.active && this.active.flag && this.loss == 2) {
      return this;
    }

    for (let c of this.children) {
      if (c.getActiveLossTwo() != null)
        return c;
    }

    return null;
  }


  findkey(v) {
    if (this.key == v)
      return this;

    for (let c of v) {
      if (c.findKey(v)) {
        return c;
      }
    }

    return null;
  }




}

class ActiveRecord {
  constructor() {
    this.flag = true;
  }
}

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

    return null;
   /* if (this.fixList.length == 0)
      return null;

    let map = {};
    map["key"] = this.fixList[i].key;
    map["active"] = this.fixList[i].active;
    map["children"] = [];

    if (i == this.fixList.length - 1) {
        return map;
    }

    map["children"].push(this.fixListJson(i+1));

    return map;*/
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

    console.log(x, y, z)
    this.root.children.pop();
    this.root.children.pop();
    this.root.children.pop();

    x.active = this.active;
    y.active = this.active;


    y.children.push(z);
    z.parent = y;

    x.children.push(y);
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

    Object.keys(map).forEach(function(key) {

      if (map[key].length >= 2 && !stop) {
        let x = map[key][0];
        let y = map[key][1];

        if (y.key > x.key) {
          x = map[key][1];
          y = map[key][0];
        }
        y.parent.children.splice(y.parent.children.indexOf(y), 1);

        y.parent = x;
        x.children.unshift(y);
        x.rank++;
        let z = x.children[x.children.length - 1];
        
        if (!z.active || !z.active.flag) {
          this.root.children.push(z);
          z.parent = this.root;
          x.children.pop();
        }

        stop = true;

      }

    })

    return true;

  }

  oneNodeLossReduction() {
    let x = this.root.getActiveLossTwo();

    if (!x)
      return false;

    let y = x.parent;

    this.root.children.unshift(x);
    x.parent = this.root;
    x.loss = 0;

    if(y.active && y.active.flag) {
       y.rank--;
       if (y.parent && (!y.parent.active || !y.parent.active.flag))
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

      if(x && y) {
        stop = true;
        if (x.key > y.key) {
          let t = x;
          x = y;
          y = t;
          let z = y.parent;

          x.children.unshift(y);
          y.parent = x;
          x.rank++;
          x.loss = 0;
          y.loss = 0;

          z.children.splice(z.children.indexOf(y), 1);

          if (z.active && z.active.flag) {
              z.rank--;
              if (z.parent && (!z.parent.active || !z.parent.active.flag) ) {
                  z.loss--;
              }
          }
        }
      }


    })


  }

}



 let margin = {top: 50, right: 50, bottom: 50, left: 50};
 let width = 1000;
 let height = 500;
 let body = d3.select("#body")
      .attr("width", width)
      .attr("height", height);

let g1 = body
        .append("g")
        .attr("transform", function(d) { 
                  return "translate(" + (margin.left) + "," + (margin.top) + ")"; })
let g2 = body
        .append("g")
        .attr("transform", function(d) { 
                  return "translate(" + (width/2 + margin.left) + "," + (margin.top) + ")"; })

let h1 = new HeapRecord();
let h2 = new HeapRecord();


function insertOne() {

  h1 = insert(h1);
  draw(g1, h1.headJson(0), h1.fixListJson(0), h1.rootJson());

}

function insertTwo() {

  h2 = insert(h2);

  draw(g2, h2.headJson(0), h2.fixListJson(0), h2.rootJson())
}

function mergeTwo() {
  h1 = merge(h1, h2);
  h2 = new HeapRecord();
  draw(g1, h1.headJson(0), h1.fixListJson(0), h1.rootJson());
  clear(g2);
}

function deleteOne() {

  h1 = deleteMin(h1);

  draw(g1, h1.headJson(0), h1.fixListJson(0), h1.rootJson());

}

function decreaseOne() {

   let v = parseInt(document.getElementById("dkey").value);

   h1 = decreaseKey(h1, v);
    draw(g1, h1.headJson(0), h1.fixListJson(0), h1.rootJson());
}


function decreaseKey(h, v) {
  if (!h.root)
    return h;
  let x = h.root.findKey(v);

  if (!x)
    return h;

  if (x == h.root) {
    h.root.key = v;
    return;
  }


  if (x.key < h.root.key) {
    let temp = h.root.key;
    h.root.key = x.key;
    x.key = temp
  }

  let y = x.parent;
  
  let index = h.root.firstPassiveChildIndex();

  if (x.isActive()) {
    h.root.children.unshift(x);
    if (y.isActive()) {
      y.rank--;
      if (!y.isActiveRoot()){
      y.loss++;
      }
    }
    x.loss = 0;
  } else {
    h.root.children.splice(index, 0, x);
  }
  x.parent = h.root;

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

  let i;

  for(i = 0; i < minNode.children.length; i++) {
     if ((!minNode.children[i].active) || (!minNode.children[i].active.flag)) {
         break;
     }
  }

  for (let c of h.root.children) {
    if (c != minNode) {
      if ((c.active && c.active.flag) || !c.isPassiveLinkable()) {
        minNode.children.splice(i++, 0, c);
      } else {
          minNode.children.push(c);
      }
      c.parent = minNode;
    }
  }

  h.root = minNode;
  h.head.splice(h.head.indexOf(minNode), 1);
  h.size--;
  h.root.active = null;
  
  for (var j = 0; j < Math.min(2, h.head.length); j++) {
    let c = h.head[0];
    h.head.splice(0,1);
    h.head.push(c);
    for(var k = c.children.length -1; k >= Math.max(0, c.children.length-2); k--) {
        if (!c.children[k].active || !c.children.active.flag) {
          minNode.children.push(c.children[k]);
          c.children[k].parent = minNode;
          c.children.pop();
        }
    }
  }

  if(!h.twoNodeLossReduction()) {
    h.oneNodeLossReduction();
  }
 // while (h.rootDegreeReduction() || h.ActiveRootReduction()){};

  return h;

}

function insert(h) {
    let v = parseInt(document.getElementById("key").value);

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


  let smallRootHeap = x;
  let largeRootHeap = y;

  if (x.root.key > y.root.key) {
    smallRootHeap = y;
    largeRootHeap = x; 
  } 

   smallRootHeap.root.children.push(largeRootHeap.root);
   largeRootHeap.root.parent = smallRootHeap.root;


   smallRootHeap.size += largeRootHeap.size;

   smallRootHeap.active = largeSizeHeap.active;


   smallSizeHeap.head.push(largeRootHeap.root);
   smallSizeHeap.head = smallSizeHeap.head.concat(largeSizeHeap.head);
   smallRootHeap.head = smallSizeHeap.head;


   smallRootHeap.one = largeSizeHeap.one;
   smallRootHeap.two = largeSizeHeap.two;
   smallRootHeap.three = largeSizeHeap.three;
   smallRootHeap.four = largeSizeHeap.four;

   if(smallRootHeap.rootDegreeReduction()) {
       smallRootHeap.ActiveRootReduction();
   }
   else if(smallRootHeap.ActiveRootReduction()) {
      smallRootHeap.rootDegreeReduction();
   }

   return smallRootHeap;
}

function clear(g) {
   g.selectAll("*").remove();
}

function draw(g, queue, fixList, data) {

  clear(g);
  let list;
  let queueNodes;
  let queueNode;

console.log(queue);
console.log(data);


 if(queue) {
      let list = d3.tree()
                    .size([height*0.1  - margin.top - margin.bottom, width/2 - margin.left-margin.right]);

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

    if (fixList) {

          list = d3.tree()
                        .size([height*0.1  - margin.top - margin.bottom, width/2 - margin.left-margin.right]);

          queueNodes = d3.hierarchy(fixList, function(d) {
                return d.children;
          });

          queueNodes = list(queueNodes);


          g.selectAll(".fixListLink")
              .data(queueNodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "fixListLink")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * 0.1 ) + ")"; })
              .attr("d", function(d) {
                return "M" + d.y + "," + d.x + "L" + d.parent.y +"," + d.parent.x;
               
          });


          queueNode = g.selectAll(".queueNode")
              .data(queueNodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * 0.1 ) + ")"; });


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
                        .size([width/2 - margin.left-margin.right, height * 0.8 - margin.top - margin.bottom]);

           let nodes = d3.hierarchy(data, function(d) {
                return d.children;
            });

           nodes = tree(nodes);



            g.selectAll(".link")
              .data( nodes.descendants().slice(1))
              .enter().append("path")
              .attr("class", "link")
              .attr("transform", function(d) { 
                    return "translate(" + 0 + "," + (height * 0.2 ) + ")"; })
              .attr("d", function(d) {
                return "M" + d.x + "," + d.y + "L" + d.parent.x +"," + d.parent.y;
             });


            let node = g.selectAll(".node")
              .data(nodes.descendants())
              .enter()
              .append("g")
              .attr("transform", function(d) { 
                          return "translate(" + 0 + "," + (height * 0.2 ) + ")"; })


            node.append("circle")
              .attr("class", "node")
              .attr("transform", function(d) { 
                return "translate(" + d.x + "," + d.y + ")"; })
              .attr("r", 15)
              .attr("fill", function(d){return d.data.active ? d.data.active.flag ? "white" : "red" : "red"  })


            node.append("text")
              .attr("dy", ".35em")
              .attr("x", function(d){ return d.x})
              .attr("y", function(d){return d.y})
              .style("text-anchor", "middle")
              .style("font", "24px times")
              .text(function(d){return d.data.key}); 

      }          
}