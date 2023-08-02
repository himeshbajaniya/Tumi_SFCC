'use strict';

$(document).ready(function () {
    let questionAnswers = document.querySelectorAll(".qa");
    if (questionAnswers.length > 0) {
        let categories = document.querySelectorAll("ul.categories li");
        let viewAll =  categories[ categories.length - 1 ];

        categories.forEach (category => {
            category.addEventListener ('click', () => {
                removeCategoryActive();
                category.classList.add("active");

                let leftCategory = category.getAttribute("rel");

                [...questionAnswers].filter ( qa => {
                    if (qa.getAttribute("class").includes(leftCategory)) {
                        qa.style.display = "block";

                    } else {
                        qa.style.display = "none";

                    }
                })


            })
        });

        viewAll.addEventListener ('click', () => {
            questionAnswers.forEach ( qa => {
                qa.style.display = "block";
            })
        });

        $(".qa").on('click', function(e) {
            $(e.target).toggleClass('active');
        });

        let removeCategoryActive = () => {
            categories.forEach ( li => {
                li.removeAttribute("class");
                li.classList.remove("active");
            })
        };
    }
});
