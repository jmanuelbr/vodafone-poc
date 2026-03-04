var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-product-detail-page.js
  var import_product_detail_page_exports = {};
  __export(import_product_detail_page_exports, {
    default: () => import_product_detail_page_default
  });

  // tools/importer/parsers/product-gallery.js
  function parse(element, { document }) {
    const cells = [];
    const images = element.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.src) return;
      const picture = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = img.src;
      imgEl.alt = img.alt || "";
      picture.appendChild(imgEl);
      cells.push([picture]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Product Gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/customer-tabs.js
  function parse2(element, { document }) {
    const cells = [];
    const tabs = element.querySelectorAll('button, [role="tab"], a[class*="tab"]');
    tabs.forEach((tab, index) => {
      const label = tab.textContent.trim();
      if (!label) return;
      const labelCell = document.createElement("div");
      labelCell.textContent = label;
      const contentCell = document.createElement("div");
      if (index === 0) {
        contentCell.textContent = "active";
      } else {
        const link = tab.querySelector("a") || tab.closest("a");
        if (link && link.href) {
          const p = document.createElement("p");
          p.textContent = "Accede a tu \xE1rea de cliente para ver tus ofertas exclusivas ";
          const a = document.createElement("a");
          a.href = link.href;
          a.textContent = "Mi Vodafone";
          p.appendChild(a);
          contentCell.appendChild(p);
        } else {
          const p = document.createElement("p");
          p.textContent = "Accede a tu \xE1rea de cliente para ver tus ofertas exclusivas ";
          const a = document.createElement("a");
          a.href = "https://www.vodafone.es/c/mi-vodafone/";
          a.textContent = "Mi Vodafone";
          p.appendChild(a);
          contentCell.appendChild(p);
        }
      }
      cells.push([labelCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Customer Tabs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tariff-filter.js
  function parse3(element, { document }) {
    const cells = [];
    const labels = element.querySelectorAll('label, [role="tab"], button');
    labels.forEach((label) => {
      const text = label.textContent.trim();
      if (!text) return;
      const labelCell = document.createElement("div");
      labelCell.textContent = text;
      const stateCell = document.createElement("div");
      const input = label.querySelector("input");
      const isActive = input && input.checked || label.classList.contains("active") || label.classList.contains("selected") || label.getAttribute("aria-selected") === "true";
      if (isActive) {
        stateCell.textContent = "active";
      }
      cells.push([labelCell, stateCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Tariff Filter", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-pricing.js
  function parse4(element, { document }) {
    const cells = [];
    const isPdpCard = element.classList.contains("tariff-card") || element.querySelector(".tariff-price") || element.querySelector(".badge");
    if (isPdpCard) {
      const badgeEl = element.querySelector('.badge, [class*="badge"], span:first-child');
      const badgeText = badgeEl ? badgeEl.textContent.trim() : "";
      const priceEl = element.querySelector('.tariff-price strong, [class*="price"] strong');
      const priceText = priceEl ? priceEl.textContent.trim() : "";
      const pricePara = element.querySelector('.tariff-price, [class*="price"]');
      let unitText = "";
      if (pricePara) {
        const fullText = pricePara.textContent.trim();
        if (priceText) {
          unitText = fullText.replace(priceText, "").trim();
        }
      }
      const allParas = element.querySelectorAll("p");
      let subtitleText = "Precio final";
      allParas.forEach((p2) => {
        const text = p2.textContent.trim();
        if (text === "Precio final" || text.toLowerCase().includes("precio")) {
          subtitleText = text;
        }
      });
      const featureItems = element.querySelectorAll("ul li");
      const features = [];
      featureItems.forEach((li) => {
        const text = li.textContent.trim();
        if (text) features.push(text);
      });
      const cellContent = document.createElement("div");
      const p = document.createElement("p");
      if (badgeText) {
        const strong = document.createElement("strong");
        strong.textContent = badgeText;
        p.appendChild(strong);
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createElement("br"));
      }
      const priceStrong = document.createElement("strong");
      priceStrong.textContent = priceText;
      p.appendChild(priceStrong);
      p.appendChild(document.createTextNode(unitText ? `,${unitText}` : " \u20AC/mes"));
      p.appendChild(document.createElement("br"));
      p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(subtitleText));
      p.appendChild(document.createElement("br"));
      p.appendChild(document.createElement("br"));
      if (features.length > 0) {
        const ul = document.createElement("ul");
        features.forEach((feat) => {
          const li = document.createElement("li");
          li.textContent = feat;
          ul.appendChild(li);
        });
        p.appendChild(ul);
      }
      const moreInfo = document.createElement("a");
      moreInfo.href = "#";
      moreInfo.textContent = "M\xE1s info";
      p.appendChild(document.createElement("br"));
      p.appendChild(moreInfo);
      const selectLink = document.createElement("a");
      selectLink.href = "#";
      selectLink.textContent = "Seleccionado";
      p.appendChild(document.createTextNode(" "));
      p.appendChild(selectLink);
      cellContent.appendChild(p);
      cells.push([cellContent]);
      const block2 = WebImporter.Blocks.createBlock(document, { name: "Cards Pricing", cells });
      element.replaceWith(block2);
      return;
    }
    const cards = element.querySelectorAll(".ws10-m-card-rate-simple");
    const cardElements = cards.length > 0 ? cards : element.querySelectorAll(".ws10-o-layout__item");
    cardElements.forEach((card) => {
      const badgeEl = card.querySelector('.ws10-c-label-card__outstanding, [class*="badge"], [class*="label-card__outstanding"]');
      const badgeText = badgeEl ? badgeEl.textContent.trim() : "";
      const priceAmount = card.querySelector('.ws10-c-price__amount, [class*="price__amount"]');
      const priceText = priceAmount ? priceAmount.textContent.trim() : "";
      const priceSubtitle = card.querySelector('.ws10-c-price__legal, [class*="price__legal"]');
      const subtitleText = priceSubtitle ? priceSubtitle.textContent.trim() : "Precio final";
      const featureItems = card.querySelectorAll("ul li");
      const featuresHtml = [];
      featureItems.forEach((item) => {
        const text = item.textContent.trim();
        if (text) featuresHtml.push(text);
      });
      const ctaLinks = card.querySelectorAll('a[class*="button"]');
      const ctas = [];
      ctaLinks.forEach((link) => {
        const text = link.textContent.trim();
        if (text && link.href) {
          const a = document.createElement("a");
          a.href = link.href;
          a.textContent = text;
          ctas.push(a);
        }
      });
      const cellContent = document.createElement("div");
      if (badgeText) {
        const badgeP = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = badgeText;
        badgeP.appendChild(strong);
        cellContent.appendChild(badgeP);
      }
      if (priceText) {
        const priceP = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = priceText;
        priceP.appendChild(strong);
        priceP.appendChild(document.createTextNode("\u20AC/mes"));
        cellContent.appendChild(priceP);
      }
      const subP = document.createElement("p");
      subP.textContent = subtitleText;
      cellContent.appendChild(subP);
      if (featuresHtml.length > 0) {
        const ul = document.createElement("ul");
        featuresHtml.forEach((feat) => {
          const li = document.createElement("li");
          li.textContent = feat;
          ul.appendChild(li);
        });
        cellContent.appendChild(ul);
      }
      if (ctas.length > 0) {
        const ctaP = document.createElement("p");
        ctas.forEach((a) => ctaP.appendChild(a));
        cellContent.appendChild(ctaP);
      }
      cells.push([document.createElement("div"), cellContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards-Pricing", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/payment-options.js
  function parse5(element, { document }) {
    const cells = [];
    const paymentTabs = element.querySelectorAll(":scope > div");
    const parentSection = element.closest("section") || element.parentElement;
    const plansContainer = parentSection ? parentSection.querySelector(".payment-plans") : null;
    const plans = plansContainer ? plansContainer.querySelectorAll(":scope > div") : [];
    paymentTabs.forEach((tab, index) => {
      const labelText = tab.textContent.trim();
      if (!labelText) return;
      const labelCell = document.createElement("div");
      labelCell.textContent = labelText;
      if (index === 0 && plans.length > 0) {
        const planCells = [];
        plans.forEach((plan) => {
          const planCell = document.createElement("div");
          const paragraphs = plan.querySelectorAll("p");
          paragraphs.forEach((p) => {
            const newP = document.createElement("p");
            newP.innerHTML = p.innerHTML;
            planCell.appendChild(newP);
          });
          planCells.push(planCell);
        });
        cells.push([labelCell, ...planCells]);
      } else {
        const cashContainer = parentSection ? parentSection.querySelector(".cash-price, .contado-price") : null;
        const cashCell = document.createElement("div");
        if (cashContainer) {
          cashCell.innerHTML = cashContainer.innerHTML;
        } else {
          const priceP = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = "252\u20AC";
          priceP.appendChild(strong);
          cashCell.appendChild(priceP);
          const canonP = document.createElement("p");
          canonP.textContent = "+3,25\u20AC canon digital";
          cashCell.appendChild(canonP);
        }
        cells.push([labelCell, cashCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Payment Options", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-steps.js
  function parse6(element, { document }) {
    const cells = [];
    const row = [];
    const steps = element.querySelectorAll("li");
    const iconUrls = [
      "https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg",
      "https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg",
      "https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg",
      "https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg"
    ];
    steps.forEach((step, index) => {
      const stepCell = document.createElement("div");
      if (iconUrls[index]) {
        const picture = document.createElement("picture");
        const img = document.createElement("img");
        img.src = iconUrls[index];
        img.alt = step.textContent.trim().split(".")[0];
        picture.appendChild(img);
        stepCell.appendChild(picture);
      }
      const p = document.createElement("p");
      p.innerHTML = step.innerHTML;
      stepCell.appendChild(p);
      row.push(stepCell);
    });
    if (row.length > 0) {
      cells.push(row);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (steps)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse7(element, { document }) {
    const heading = element.querySelector('.ws10-c-title-standard__title, h2, [class*="title"]');
    const textArea = element.querySelector('.ws10-m-text-image__paragraph, [class*="paragraph"], [class*="content-text"]');
    const img = element.querySelector(".ws10-m-text-image__img, img");
    const textCol = document.createElement("div");
    if (heading) {
      const h2 = document.createElement("h2");
      const strong = document.createElement("strong");
      strong.textContent = heading.textContent.trim();
      h2.appendChild(strong);
      textCol.appendChild(h2);
    }
    if (textArea) {
      const clone = textArea.cloneNode(true);
      while (clone.firstChild) {
        textCol.appendChild(clone.firstChild);
      }
    } else {
      const paragraphs = element.querySelectorAll("p");
      paragraphs.forEach((p) => {
        const clone = p.cloneNode(true);
        textCol.appendChild(clone);
      });
    }
    const imgCol = document.createElement("div");
    if (img) {
      const picture = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = img.src;
      imgEl.alt = img.alt || (heading ? heading.textContent.trim() : "");
      picture.appendChild(imgEl);
      imgCol.appendChild(picture);
    }
    const cells = [[textCol, imgCol]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/promo-card.js
  function parse8(element, { document }) {
    const parentSection = element.closest("section") || element.parentElement;
    const promoImg = parentSection ? parentSection.querySelector('img[src*="promo"], img[src*="reestrena"], img[class*="promo"]') : null;
    const cardImg = element.querySelector("img");
    const imgCol = document.createElement("div");
    const img = promoImg || cardImg;
    if (img) {
      const picture = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = img.src;
      imgEl.alt = img.alt || "Re-estrena";
      picture.appendChild(imgEl);
      imgCol.appendChild(picture);
    }
    const textCol = document.createElement("div");
    const title = element.querySelector('h3, h4, [class*="title"]');
    const titleText = title ? title.textContent.trim() : "";
    const contentParts = [];
    const children = element.querySelectorAll(":scope > p, :scope > ol, :scope > ul");
    children.forEach((child) => {
      if (child.tagName === "OL" || child.tagName === "UL") {
        const items = child.querySelectorAll("li");
        items.forEach((item, idx) => {
          const prefix = child.tagName === "OL" ? `${idx + 1} - ` : "";
          contentParts.push(`${prefix}${item.textContent.trim()}`);
        });
      } else {
        const text = child.textContent.trim();
        if (text) contentParts.push(text);
      }
    });
    const p = document.createElement("p");
    if (titleText) {
      const strong = document.createElement("strong");
      strong.textContent = titleText;
      p.appendChild(strong);
    }
    contentParts.forEach((part) => {
      p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(part));
    });
    textCol.appendChild(p);
    const cells = [[imgCol, textCol]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Promo Card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse9(element, { document }) {
    const cells = [];
    const ws10Items = element.querySelectorAll(".ws10-c-accordion-list");
    if (ws10Items.length > 0) {
      ws10Items.forEach((item) => {
        const questionEl = item.querySelector('.ws10-c-accordion-list__title, h3, summary, [class*="title"]');
        const questionText = questionEl ? questionEl.textContent.trim() : "";
        if (!questionText) return;
        const answerEl = item.querySelector('[data-ws10-js="collapse"], .ws10-c-accordion-list__body, [class*="body"], [class*="content"]');
        const questionCell = document.createElement("div");
        questionCell.textContent = questionText;
        const answerCell = document.createElement("div");
        if (answerEl) {
          const clone = answerEl.cloneNode(true);
          const buttonsAndIcons = clone.querySelectorAll('button, svg, [class*="chevron"], [class*="icon"]');
          buttonsAndIcons.forEach((el) => el.remove());
          answerCell.innerHTML = clone.innerHTML;
        }
        cells.push([questionCell, answerCell]);
      });
    } else {
      const headings = element.querySelectorAll("h3");
      if (headings.length > 0) {
        headings.forEach((h3) => {
          const titleText = h3.textContent.trim();
          if (!titleText) return;
          const titleCell = document.createElement("div");
          titleCell.textContent = titleText;
          const contentCell = document.createElement("div");
          let sibling = h3.nextElementSibling;
          while (sibling && sibling.tagName !== "H3") {
            if (sibling.tagName === "TABLE") {
              const rows = sibling.querySelectorAll("tr");
              const specParts = [];
              rows.forEach((row) => {
                const th = row.querySelector("th");
                const td = row.querySelector("td");
                if (th && td) {
                  const label = th.textContent.trim();
                  const values = [];
                  const paras = td.querySelectorAll("p");
                  if (paras.length > 0) {
                    paras.forEach((p) => {
                      const val = p.textContent.trim();
                      if (val) values.push(val);
                    });
                  } else {
                    values.push(td.textContent.trim());
                  }
                  specParts.push(`**${label}:** ${values.join(" \xB7 ")}`);
                }
              });
              const specP = document.createElement("p");
              specP.innerHTML = specParts.join("<br>");
              contentCell.appendChild(specP);
            } else {
              const clone = sibling.cloneNode(true);
              contentCell.appendChild(clone);
            }
            sibling = sibling.nextElementSibling;
          }
          cells.push([titleCell, contentCell]);
        });
      } else {
        const items = element.querySelectorAll("li");
        items.forEach((item) => {
          const questionEl = item.querySelector('h3, summary, [class*="title"]');
          const questionText = questionEl ? questionEl.textContent.trim() : "";
          if (!questionText) return;
          const answerEl = item.querySelector('[class*="body"], [class*="content"]');
          const questionCell = document.createElement("div");
          questionCell.textContent = questionText;
          const answerCell = document.createElement("div");
          if (answerEl) {
            answerCell.innerHTML = answerEl.cloneNode(true).innerHTML;
          }
          cells.push([questionCell, answerCell]);
        });
      }
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/vodafone-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        ".MDDfooter"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#icSpinner",
        "#icModal",
        ".x-root-container"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "link",
        "noscript",
        "iframe",
        ".tol-config",
        ".tol-literals",
        ".tol-modules",
        ".tol-parametros_config",
        ".tol-parametros_analitica"
      ]);
      const svgContainers = element.querySelectorAll("div > svg:only-child");
      svgContainers.forEach((svg) => {
        const parent = svg.parentElement;
        if (parent && !parent.closest("#fichaTol") && parent.children.length === 1) {
          parent.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        ".ws10-m-with-breadcrumb",
        'nav[aria-label="breadcrumb"]',
        'nav[aria-label="Navegaci\xF3n"]',
        "ftol-ficha-breadcrumbs",
        "mva10-c-breadcrumbs"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".usp-bar",
        ".product-benefits",
        ".order-summary",
        "ftol-ficha-legal-conditions"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".ws10-c-carousel__animation-menu",
        ".ws10-c-carousel__bullets",
        ".ws10-c-carousel__play"
      ]);
      element.querySelectorAll('[id^="batBeacon"]').forEach((el) => el.remove());
      element.querySelectorAll('img[src*="pixel"], img[src*="beacon"], img[src*="tracking"]').forEach((el) => el.remove());
    }
    if (hookName === TransformHook.afterTransform) {
      const allElements = element.querySelectorAll("*");
      allElements.forEach((el) => {
        el.removeAttribute("data-analytics-category");
        el.removeAttribute("data-analytics-context");
        el.removeAttribute("data-analytics-element");
        el.removeAttribute("data-analytics-id");
        el.removeAttribute("data-analytics-link");
        el.removeAttribute("data-analytics-product");
        el.removeAttribute("data-sq-get");
        el.removeAttribute("data-sq-mod");
        el.removeAttribute("data-vfes-seo-empathy-offer-details");
        el.removeAttribute("data-vfes-seo-empathy-price");
        el.removeAttribute("data-vfes-seo-empathy-promoperiod");
        el.removeAttribute("data-vfes-seo-empathy-promoprice");
        el.removeAttribute("data-config");
        el.removeAttribute("data-initialized");
      });
      WebImporter.DOMUtils.remove(element, [
        "noscript",
        "iframe",
        "link"
      ]);
    }
  }

  // tools/importer/import-product-detail-page.js
  var parsers = {
    "product-gallery": parse,
    "customer-tabs": parse2,
    "tariff-filter": parse3,
    "cards-pricing": parse4,
    "payment-options": parse5,
    "columns-steps": parse6,
    "columns": parse7,
    "promo-card": parse8,
    "accordion": parse9
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "product-detail-page",
    description: "Vodafone product detail page (PDP) for mobile phones with product gallery, tariff pricing cards, payment options, purchase process steps, promotions, and specifications accordion",
    urls: [
      "https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/",
      "https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/samsung-galaxy-a56-5g-negro-256gb-315792/",
      "https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/oppo-a6-pro-5g-negro-azul-256gb-316284/",
      "https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/oppo-reno-14-fs-5g-verde-512gb-316150/"
    ],
    blocks: [
      {
        name: "product-gallery",
        instances: [".mva10-c-image-gallery", "ftol-ficha-image-gallery"]
      },
      {
        name: "customer-tabs",
        instances: ["ftol-register-type-tabs", "mva10-c-tabs-simple"]
      },
      {
        name: "tariff-filter",
        instances: ["ftol-selector-tarifa", "mva10-c-filter"]
      },
      {
        name: "cards-pricing",
        instances: ["ftol-tarifa-cards"]
      },
      {
        name: "payment-options",
        instances: ["ftol-price-contado-plazos"]
      },
      {
        name: "columns-steps",
        instances: ["ftol-time-line-two-step-sales", "mva10-c-timeline-steps"]
      },
      {
        name: "columns",
        instances: ["ftol-no-surprises-two-step-sales"]
      },
      {
        name: "promo-card",
        instances: ["ftol-ficha-promotions"]
      },
      {
        name: "accordion",
        instances: ["ftol-ficha-characteristics", "mva10-c-accordion"]
      },
      {
        name: "section-product-details",
        instances: ["ftol-ficha-characteristics"],
        section: ""
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, payload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      if (blockDef.name.startsWith("section-")) {
        return;
      }
      blockDef.instances.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
          }
          elements.forEach((element) => {
            pageBlocks.push({
              name: blockDef.name,
              selector,
              element,
              section: blockDef.section || null
            });
          });
        } catch (e) {
          console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`, e);
        }
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_product_detail_page_default = {
    /**
     * Main transformation function using one input / multiple outputs pattern
     */
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_product_detail_page_exports);
})();
