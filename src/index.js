import marked from "marked";

AFRAME.registerSystem("markdown", {
  schema: {
    normalFont: { type: "string" },
    boldFont: { type: "string" }
  },
  init() {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: "Roboto";
        src: 
          url("${this.data.normalFont.replace("-msdf.json", ".ttf")}"),
          url("${this.data.boldFont.replace("-msdf.json", ".ttf")}");
      }
      .aframe-markdown-rendered-html {
        font-family: "Roboto";
        position: absolute;
        top: 0;
        left: -9999px;
      }
      .aframe-markdown-rendered-html img {
        width: 100%;
      }
    `;
    document.head.prepend(style);
  }
});

AFRAME.registerComponent("markdown", {
  schema: {
    src: { type: "string" },
    wrapCount: { type: "number", default: 40 },
    padding: { type: "number", default: 0.05 }
  },
  init() {
    this.renderedHtml = document.createElement("div");
    this.renderedHtml.className = "aframe-markdown-rendered-html";
    document.body.appendChild(this.renderedHtml);
    this.container = document.createElement("a-entity");
    this.el.appendChild(this.container);
  },
  _render(node, offset, scaleFactor) {
    offset = offset / scaleFactor;
    // Note: There are lots of magic numbers here. These will probably only work will for the default Roboto font.
    // In theory you could calculate all the adjustments correctly based off the actual text metrics instead.
    switch(node.nodeName) {
      case "LI":
        const liRect = node.getClientRects()[0];
        const style = window.getComputedStyle(node);
        if (style.listStyleType === "decimal") {
          const numEl = document.createElement("a-text");

          const start = node.parentNode.start;
          let nodeIndex = 0;
          for (const childNode of node.parentNode.childNodes) {
            if (childNode.nodeName === "LI") nodeIndex++;
            if (childNode === node) break;
          }
          numEl.setAttribute("value", start + nodeIndex - 1 + ".");

          numEl.setAttribute("color", "black");
          numEl.setAttribute("font", this.system.data.normalFont);
          numEl.setAttribute("align", "right");

          const fontSize = parseFloat(style.fontSize) / scaleFactor * 4.44;
          numEl.setAttribute("scale", {x: fontSize, y: fontSize, z: fontSize});

          numEl.setAttribute("position", {
            x: liRect.left / scaleFactor - offset,
            y: -liRect.top / scaleFactor - fontSize / 16
          });

          this.container.appendChild(numEl);
        } else {
          const circleEl = document.createElement("a-circle");
          circleEl.setAttribute("segments", 8);
          circleEl.setAttribute("radius", 0.008);
          circleEl.setAttribute("color", "black");

          const fontSize = parseFloat(style.fontSize) / scaleFactor * 25;
          circleEl.setAttribute("scale", {x: fontSize, y: fontSize, z: fontSize});

          circleEl.setAttribute("position", {
            x: liRect.left / scaleFactor - offset - fontSize / 50,
            y: -liRect.top / scaleFactor - fontSize / 70
          });

          this.container.appendChild(circleEl);
        }
        break;
      case "#text":
        const textEl = document.createElement("a-entity");
        const rect = node.parentNode.getClientRects()[0];
        const wrapCountDecrease = (rect.left / scaleFactor * 20 - offset * 20);

        const bold = ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.parentNode.nodeName); 

        textEl.setAttribute("text", {
          font: bold ? this.system.data.boldFont : this.system.data.normalFont,
          negate: !bold,
          value: node.textContent.replace(/\n/g, ''),
          anchor: 'left', baseline: 'top', color: "black",
          width: rect.width / scaleFactor / 2,
          wrapCount: this.data.wrapCount - wrapCountDecrease
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

        this.container.appendChild(textEl);
        break;
      case "IMG":
        if (node.naturalWidth === 0) return;
        const imgEl = document.createElement("a-image");
        const imgRect = node.getClientRects()[0];
        imgEl.setAttribute("src", node.src);
        imgEl.setAttribute("side", "front");
        imgEl.setAttribute("scale", {
          x: imgRect.width / scaleFactor,
          y: imgRect.height / scaleFactor});
        imgEl.setAttribute("position", {
          x: imgRect.width / scaleFactor / 2,
          y: -imgRect.top / scaleFactor - imgRect.height / scaleFactor / 2
        });
        this.container.appendChild(imgEl);
        break;
    }
  },
  _traverse(node, offset, scaleFactor) {
    this._render(node, offset, scaleFactor);
    for (const child of node.childNodes) {
      this._traverse(child, offset, scaleFactor);
    }
  },
  async update() {
    const template = document.createElement("template");

    let node;
    try {
      node = document.querySelector(this.data.src);
    } catch(e) {}
    const src = node ? node.data : this.data.src;

    template.innerHTML = marked(src);

    this.renderedHtml.innerHTML = "";
    this.renderedHtml.style.width = `${this.data.wrapCount * 45.3 / 80}em`;
    this.renderedHtml.appendChild(template.content);

    const imagePromises = [];
    this.renderedHtml.querySelectorAll("img").forEach(img => {
      if (img.complete) return;
      imagePromises.push(new Promise((resolve, reject) => {
        img.addEventListener("load", resolve);
        img.addEventListener("error", () => {
          console.warn(`markdown: Image failed to load - ${img.src}`);
          resolve();
        });
      }));
    });
    await Promise.all(imagePromises);

    this.container.innerHTML = '';
    const rect = this.renderedHtml.getClientRects()[0];
    const scaleFactor = 600;
    this.container.object3D.position.set(-rect.width / scaleFactor / 2, rect.height / scaleFactor / 2, 0);
    this._traverse(this.renderedHtml, rect.left, scaleFactor);

    const background = document.createElement('a-plane');
    background.setAttribute('position', `${rect.width / scaleFactor / 2} ${-rect.height/ scaleFactor / 2} -0.001`);
    background.setAttribute('scale', `${rect.width / scaleFactor + this.data.padding} ${rect.height/ scaleFactor + this.data.padding} 1`);
    background.setAttribute('roughness', 1);
    background.setAttribute('side', 'double');
    this.container.appendChild(background);

    this.container.emit("rendered");
  }
});
