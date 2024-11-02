import { C, UI } from "./constants.js";

export function setupCollapsibles(element) {
    for (var i = 0; i < element.length; i++) {
        element[i].addEventListener(UI.CLICK, function () {
            this.classList.toggle(UI.ACTIVE);
            const content = this.nextElementSibling;
            content.style.maxHeight ? (content.style.maxHeight = null) : content.style.maxHeight = content.scrollHeight + C.PX;
        });
    }
}