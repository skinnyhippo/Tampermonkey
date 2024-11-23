// ==UserScript==
// @name         Add Labor % - Payment (Beta Display)
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  Displays only the calculated Labor % with updated title
// @author       Ian
// @match        https://meineke.tekmetric.com/admin/shop/*/repair-orders/*/payment
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let previousUrl = location.href;
    let debounceTimer = null;

    // Function to locate a specific row by label text
    function findRowByLabel(table, labelText) {
        const rows = table.querySelectorAll('tr');
        for (let i = 0; i < rows.length; i++) {
            const firstCell = rows[i].querySelector('td, th');
            if (firstCell && firstCell.textContent.trim() === labelText) {
                return i;
            }
        }
        console.error(`Row with label "${labelText}" not found.`);
        return -1;
    }

    // Function to extract numeric data from a specific cell
    function extractDataFromTable(table, rowIndex, colIndex, label) {
        if (!table) {
            console.error(`Table not found for ${label}.`);
            return null;
        }

        const rows = table.querySelectorAll('tr');
        if (rowIndex >= 0 && rows.length > rowIndex) {
            const cells = rows[rowIndex].querySelectorAll('td, th');
            if (cells.length > colIndex) {
                const cellData = cells[colIndex].textContent.trim();
                return parseFloat(cellData.replace(/[^0-9.-]+/g, ""));
            } else {
                console.error(`Column ${colIndex + 1} does not exist in Row ${rowIndex + 1} for ${label}.`);
            }
        } else {
            console.error(`Row ${rowIndex + 1} does not exist for ${label}.`);
        }
        return null;
    }

    // Create or update the display box (Centered Bottom Display)
    function updateDisplayBox(laborPercentage) {
        let container = document.getElementById('custom-data-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'custom-data-container';
            container.style.position = 'fixed';
            container.style.bottom = '20px'; // Bottom-center
            container.style.left = '50%'; // Center horizontally
            container.style.transform = 'translateX(-50%)';
            container.style.padding = '10px';
            container.style.backgroundColor = '#f0f0f0';
            container.style.border = '1px solid #ccc';
            container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
            container.style.zIndex = '10000';
            container.style.fontSize = '14px';
            container.style.textAlign = 'center'; // Original styling
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <strong>Beta Labor Test %:</strong><br>
            ${laborPercentage}%
        `;
    }

    // Remove the display box if it exists
    function removeDisplayBox() {
        const container = document.getElementById('custom-data-container');
        if (container) {
            container.remove();
        }
    }

    // Function to extract and update data
    function updateData() {
        const table = document.querySelector('table');
        if (table) {
            const balanceDueRowIndex = findRowByLabel(table, "BALANCE DUE");
            const totalLaborRowIndex = findRowByLabel(table, "Total Labor");

            const balanceDue = extractDataFromTable(table, balanceDueRowIndex, 1, "Balance Due");
            const totalLabor = extractDataFromTable(table, totalLaborRowIndex, 1, "Total Labor");

            if (balanceDue !== null && totalLabor !== null) {
                const laborPercentage = ((totalLabor / balanceDue) * 100).toFixed(2);
                updateDisplayBox(laborPercentage);
            }
        } else {
            console.error("Table not found.");
            removeDisplayBox();
        }
    }

    // Monitor URL changes and reinitialize as needed
    function monitorUrlChanges() {
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;

            if (currentUrl !== previousUrl) {
                previousUrl = currentUrl;

                if (currentUrl.includes('/payment')) {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(updateData, 500);
                } else {
                    removeDisplayBox();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initialize script
    function initialize() {
        if (location.href.includes('/payment')) {
            updateData();
        }
        monitorUrlChanges();
    }

    // Start the script after the page loads
    window.addEventListener('load', initialize);
})();
