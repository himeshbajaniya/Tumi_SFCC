'use strict';

module.exports = {
    productLanding: function() {
        // Sticky Banner
        let categoryBanner = document.querySelector('.category-banner');
        if (categoryBanner) {
    
        // SortBy Dropdown Menu
        let sortByRadioBtns = document.querySelectorAll('.dropdown-menu-right input[type=radio]');
        if ($('input[name="rfk-sort-order"]:checked').length > 0) {
            $("#dropdownMenuLink .selectable").text($('input[name="rfk-sort-order"]:checked').attr('data-id'));
        } else if (sortByRadioBtns[0]) {
            $("#dropdownMenuLink .selectable").text(sortByRadioBtns[0].getAttribute("data-id"));
        }

        sortByRadioBtns.forEach( radioButton => {
            radioButton.addEventListener('change', () => {
                $("#dropdownMenuLink .selectable").text(radioButton.getAttribute("data-id"));
            })
        })    
    
        // Show & Hide Filter-bar
        let btnFilter = document.querySelector(".filter"),
        btnFilterText = document.querySelector(".btn-filter-text"),
        selectedFilterContainer = document.querySelector('.selected-filter-container'),
        refinementBar = document.querySelector(".refinement-bar"),
        productTilesContainer = document.querySelector(".product-tiles-container");
        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                btnFilter.classList.toggle("active");
                refinementBar.classList.toggle("active");
                selectedFilterContainer.classList.toggle("active");
                if(btnFilter.classList.contains("active")){
                    btnFilterText.innerHTML = "Hide Filters";
                    productTilesContainer.classList.add("col-sm-9");
                    productTilesContainer.classList.remove("col-sm-12");
                    $('.productTileTemplates').addClass('filterActive');
                    if(window.innerWidth > 1023) {
                        $('.slot-1').addClass('no-padding-right');
                    }
                    if(window.innerWidth <= 769) {
                        $('.slot-1').removeClass('col-sm-4').addClass('col-sm-6 no-padding-right');
                    }
                } else {
                    btnFilterText.innerHTML = "Show Filters";
                    productTilesContainer.classList.add("col-sm-12");
                    productTilesContainer.classList.remove("col-sm-9");
                    $('.productTileTemplates').removeClass('filterActive');
                    if(window.innerWidth > 1023) {
                        $('.slot-1').removeClass('no-padding-right');
                    }
                    if(window.innerWidth <= 769){
                    $('.slot-1').removeClass('col-sm-6 no-padding-right').addClass('col-sm-4');
                    }
                }
            });
        }
    }
    }
};