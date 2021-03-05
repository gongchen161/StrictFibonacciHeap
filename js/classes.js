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
    this.color = null;
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

    if (this.children.length == 0)
      return 1;

    let ma = 0;
    for (let c of this.children) {
      ma = Math.max(ma, c.getHeight());
    }

    return 1 + ma;
  }

  getWidth() {
     if (this.children.length == 0)
      return 1;

    let ma = 0;

    for (let c of this.children) {
      ma += c.getWidth();
    }

    return ma;

  }

  getRank() {
    if (this.isActive())
      return this.rank;

    return "null";
  }

   getLoss() {
    if (this.isActive())
      return this.loss;

    return "null";
  }

  isPassiveLinkable() {
    if (this.isActive())
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

  updateActivePosiveNode(map) {
    if (this.isActive() && !this.isActiveRoot() && this.loss > 0) {
      if(!map[this.rank]) {
       map[this.rank] = [];
      }
      map[this.rank].push(this);
    } 

    for (let c of this.children) {
      c.updateActivePosiveNode(map);
    }
  }

  getActiveLossTwo() {
    if (this.isActive() && !this.isActiveRoot() && this.loss == 2) {
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
    this.head = [];
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
    map["length"] = 1;
    map["node"] = this.head[i];

    if (i == this.head.length - 1) {
        return map;
    }
    let m = this.headJson(i+1);
    map["children"].push(m);
    map["length"] = m["length"] + 1;
    return map;
  }

  fixListJson(i) {
    if (!this.root)
      return null;
    let map1 = {};
    let map2 = {};
    this.root.updateActiveRoot(map1);
    this.root.updateActivePosiveNode(map2);

    let arr = [];

    Object.keys(map1).forEach(function(key) {
      if (map1[key].length >= 2) {
        for (let c of map1[key]){
            c.color = "#efead2"
            arr.push(c);
          }
      }
    })

    Object.keys(map1).forEach(function(key) {
      if (map1[key].length == 1) {
        for (let c of map1[key]){
            c.color = "#e3efd2"
            arr.push(c);
          }
      }
    })

    Object.keys(map2).forEach(function(key) {
        
         if (map2[key].length == 1) {
          for (let c of map2[key]){
            if (c.loss == 1){
              c.color = "#d2ddef"
              arr.push(c);
            }
          }
        }
    })

      Object.keys(map2).forEach(function(key) {
        
         if (map2[key].length > 1) {
          let n = 0;
          for (let c of map2[key]){
              if (c.loss == 1) {
                n++;
              }
          }

          for (let c of map2[key]){
              if (n >= 2 && c.loss == 1) {
                c.color = "#efd2ea"
                arr.push(c);
              }
          }

           for (let c of map2[key]){
              if (c.loss > 1) {
                c.color = "#efd2ea"
                arr.push(c);
              }
          }


        }
    })
    console.log(arr);
    let res = this.jsonFy(arr, 0);

    return res;
  }

  jsonFy(arr, i) {

    if (arr.length == 0)
      return null;
  
    let map = {};
    map["key"] = arr[i].key;
    map["children"] = [];
    map["active"] = arr[i].active;
    map["node"] = arr[i];
    map["color"] = arr[i].color;
    map["length"] = arr.length;

    if (i == arr.length - 1) {
        return map;
    }
    
    map["children"].push(this.jsonFy(arr, i+1));

    return map;
  }


  findNode(v) {
    if(!this.root)
      return null;
    
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
    z.loss = 0;

    x.rank = 1;
    y.rank = 0;
    z.rank = 0;

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
        x.loss = 0;
        y.loss = 0;

        let z = x.children[x.children.length - 1];

        if (z.isPassiveLinkable()) {
          self.root.children.push(z);
          z.parent = self.root;
          x.children.pop();
        } else if (z.isPassive()) {
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

    addP("...<b>OneNodeLossReduction</b> on node <b>" + x.key + " </b>");

    let y = x.parent;

    this.root.children.unshift(x);
    x.parent = this.root;

    y.children.splice(y.children.indexOf(x), 1);

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
        if (c.loss == 1 && c.isActive() && !c.isActiveRoot()) {
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

          z.children.splice(z.children.indexOf(y), 1);

          x.rank++;
          x.loss = 0;
          y.loss = 0;

          

          if (z.isActive()) {
              z.rank--;
              if (!z.isActiveRoot()) {
                  z.loss++;
              }
          }
        }
      })
  }
}