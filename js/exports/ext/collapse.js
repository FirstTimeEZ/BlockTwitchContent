import { C, UI } from "./_ext-constants.js";

/**
 * Sets up collapsible elements by adding click event listeners to toggle their visibility.
 * 
 * @remarks
 * on `Click` the `nextElementSibling` of each element will have the visiblility of its content toggled
 *
 * @param {HTMLElement[]} element - An array of HTML elements that should be collapsible.
 */
export function setupCollapsibles(element) {
    for (var i = 0; i < element.length; i++) {
        element[i].addEventListener(UI.CLICK, function () {
            this.classList.toggle(UI.ACTIVE);
            const content = this.nextElementSibling;
            content.style.maxHeight ? (content.style.maxHeight = null) : content.style.maxHeight = content.scrollHeight + C.PX;
        });
    }
}