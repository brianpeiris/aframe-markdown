AFRAME.registerComponent("markdown", {
  schema: {
    src: { type: "string" }
  },
  _render(node, offset) {
    const scaleFactor = 200;
    offset = offset / scaleFactor;
    switch(node.nodeName) {
      case "LI":
        const liRect = node.getClientRects()[0];
        const style = window.getComputedStyle(node);
        if (style.listStyleType === "decimal") {
          const numEl = document.createElement("a-text");

          const start = node.parentNode.start;
          const nodeIndex = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
          numEl.setAttribute("value", start + nodeIndex + ".");

          numEl.setAttribute("color", "black");
          numEl.setAttribute("font", "./vendor/aframe@0.8.2/Roboto-msdf.json");
          numEl.setAttribute("align", "right");

          const fontSize = parseFloat(style.fontSize) / 45;
          numEl.setAttribute("scale", {x: fontSize, y: fontSize, z: fontSize});

          numEl.setAttribute("position", {
            x: liRect.left / scaleFactor - offset,
            y: -liRect.top / scaleFactor - fontSize / 16
          });

          this.el.appendChild(numEl);
        } else {
          const circleEl = document.createElement("a-circle");
          circleEl.setAttribute("radius", 0.008);
          circleEl.setAttribute("color", "black");

          const fontSize = parseFloat(style.fontSize) / 8;
          circleEl.setAttribute("scale", {x: fontSize, y: fontSize, z: fontSize});

          circleEl.setAttribute("position", {
            x: liRect.left / scaleFactor - offset - fontSize / 50,
            y: -liRect.top / scaleFactor - fontSize / 70
          });

          this.el.appendChild(circleEl);
        }
        break;
      case "#text":
        const textEl = document.createElement("a-entity");
        const rect = node.parentNode.getClientRects()[0];
        const wrapCountDecrease = (rect.left / scaleFactor * 20 - offset * 20);

        const bold = ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.parentNode.nodeName); 

        textEl.setAttribute("text", {
          font: bold ? "./Roboto-Bold-msdf.json" : "./vendor/aframe@0.8.2/Roboto-msdf.json",
          negate: !bold,
          value: node.textContent.replace(/\n/g, ''),
          anchor: 'left', baseline: 'top', color: "black",
          width: rect.width / scaleFactor / 2,
          wrapCount: 40 - wrapCountDecrease
        });

        const fontSize = parseFloat(window.getComputedStyle(node.parentNode).fontSize) / 8;
        textEl.setAttribute("scale", {x: fontSize, y: fontSize, z: fontSize});

        let y;
        if (node.previousSibling && node.previousSibling.nodeName === "BR") {
          const brRect = node.previousSibling.getClientRects()[0];
          y = -(brRect.top + brRect.height) / scaleFactor;
        } else {
          y = -rect.top / scaleFactor;
        }

        textEl.setAttribute("position", {x: rect.left / scaleFactor - offset, y});

        this.el.appendChild(textEl);
        break;
      case "IMG":
        const imgEl = document.createElement("a-image");
        const imgRect = node.getClientRects()[0];
        imgEl.setAttribute("src", node.src);
        imgEl.setAttribute("scale", {
          x: imgRect.width / scaleFactor,
          y: imgRect.height / scaleFactor});
        imgEl.setAttribute("position", {
          x: imgRect.width / scaleFactor / 2,
          y: -imgRect.top / scaleFactor - imgRect.height / scaleFactor / 2
        });
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
