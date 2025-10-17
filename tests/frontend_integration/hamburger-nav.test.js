const fs = require('fs');
const path = require('path');

describe('hamburger-nav integration', () => {

    beforeEach(() => {
        // Minimal DOM for testing
        document.body.innerHTML = `
          <nav id="headerNav" style="display: none;">
            <div id="swapButton">
              <ul class="inline-list" role="menu" aria-labelledby="burgerImage">
                <li role="none">
                  <button id="burgerImage" type="button" aria-haspopup="true" 
                  aria-controls="headerNav" aria-label="Toggle Navigation">
                    <svg id="hamburger-nav"></svg>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        `;

        // Import the JS under test (using format requried for JSX)
        jest.isolateModules(() => {
            require('../../assets/js/hamburger-nav.js');
        });
    });

    test('clicking burgerImage toggles headerNav visibility and swaps icons', async () => {

        const headerNav = document.querySelector('#headerNav');
        const burgerButton = document.querySelector('#burgerImage');
        expect(burgerButton).not.toBeNull();

        // Initially, headerNav is hidden
        expect(headerNav.style.display).toBe('none');

        // Click burger to open
        burgerButton.click();
        expect(headerNav.style.display).toBe('flex');
        expect(burgerButton.getAttribute('aria-expanded')).toBe('true');

        // // Click again to close
        // burgerButton.click();
        // expect(headerNav.style.display).toBe('none');
        // expect(burgerButton.getAttribute('aria-expanded')).toBe('false');
    });

    test('clicking burgerImage toggles headerNav visibility and swaps icons 2', async () => {

        const headerNav = document.querySelector('#headerNav');
        const burgerButton = document.querySelector('#burgerImage');
        expect(burgerButton).not.toBeNull();

        // Initially, headerNav is hidden
        expect(headerNav.style.display).toBe('none');

        // Click burger to open
        burgerButton.click();
        expect(headerNav.style.display).toBe('flex');
        expect(burgerButton.getAttribute('aria-expanded')).toBe('true');

        // Click again to close
        burgerButton.click();
        expect(headerNav.style.display).toBe('none');
        expect(burgerButton.getAttribute('aria-expanded')).toBe('false');
    });
});