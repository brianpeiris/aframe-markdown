AFRAME.registerComponent("markdown", {
  schema: {
    src: { type: "string" }
  },
  _render(node, offset) {
    switch(node.nodeName) {
      case "LI":
        const liRect = node.getClientRects()[0];
        const style = window.getComputedStyle(node);
        if (style.listStyleType === "decimal") {
          const numEl = document.createElement("a-text");
          const start = node.parentNode.start;
          numEl.setAttribute("value", start + Array.prototype.indexOf.call(node.parentNode.childNodes, node) + ".");
          numEl.setAttribute("color", "black");
          numEl.setAttribute("font", "./vendor/aframe@0.8.2/Roboto-msdf.json");
          const liScale = parseFloat(style.fontSize) / 45;
          numEl.setAttribute("scale", {x: liScale, y: liScale, z: liScale});
          numEl.setAttribute("align", "right");
          numEl.setAttribute("position", {x: liRect.left / 200 - offset / 200, y: -liRect.top / 200 - liScale / 16});
          this.el.appendChild(numEl);
        } else {
          const circleEl = document.createElement("a-circle");
          circleEl.setAttribute("radius", 0.008);
          circleEl.setAttribute("color", "black");
          const liScale = parseFloat(style.fontSize) / 8;
          circleEl.setAttribute("scale", {x: liScale, y: liScale, z: liScale});
          circleEl.setAttribute("position", {x: liRect.left / 200 - offset / 200 - liScale / 50, y: -liRect.top / 200 - liScale / 70});
          this.el.appendChild(circleEl);
        }
        break;
      case "#text":
        const textEl = document.createElement("a-entity");
        const rect = node.parentNode.getClientRects()[0];
        const wrapCountDecrease = (rect.left / 200 * 20 - offset / 200 * 20);
        const bold = ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.parentNode.nodeName); 
        textEl.setAttribute("text", {
          font: bold ? "./Roboto-Bold-msdf.json" : "roboto", negate: !bold,
          value: node.textContent.replace(/\n/g, ''),
          anchor: 'left', baseline: 'top', color: "black",
          width: rect.width / 400,
          wrapCount: 40 - wrapCountDecrease
        });
        const scale = parseFloat(window.getComputedStyle(node.parentNode).fontSize) / 8;
        textEl.setAttribute("scale", {x: scale, y: scale, z: scale});
        let y;
        if (node.previousSibling && node.previousSibling.nodeName === "BR") {
          const brRect = node.previousSibling.getClientRects()[0];
          y = -(brRect.top + brRect.height) / 200;
        } else {
          y = -rect.top / 200;
        }
        textEl.setAttribute("position", {x: rect.left / 200 - offset / 200, y});
        this.el.appendChild(textEl);
        break;
      case "IMG":
        const imgEl = document.createElement("a-image");
        const imgRect = node.getClientRects()[0];
        imgEl.setAttribute("src", node.src);
        imgEl.setAttribute("scale", {x: imgRect.width / 200, y: imgRect.height / 200});
        imgEl.setAttribute("position", {x: imgRect.width / 400, y: -imgRect.top / 200 - imgRect.height / 400});
        this.el.appendChild(imgEl);
        break;
    }
  },
  _traverse(node, offset) {
    this._render(node, offset);
    for (const child of node.childNodes) {
      this._traverse(child, offset);
    }
  },
  async update() {
    const template = document.createElement("template");
    template.innerHTML = marked(this.data.src);

    const rendered = document.getElementById("rendered-html");
    rendered.innerHTML = "";
    rendered.appendChild(template.content);

    const imagePromises = [];
    rendered.querySelectorAll("img").forEach(img => {
      imagePromises.push(new Promise(resolve => img.addEventListener("load", resolve)));
    });
    await Promise.all(imagePromises);

    this.el.innerHTML = '';
    this._traverse(document.getElementById("rendered-html"), rendered.getClientRects()[0].left);

    this.el.emit("rendered");
  }
});
