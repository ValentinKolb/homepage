document.addEventListener("DOMContentLoaded", function () {
    // Finde alle Tabs auf der Seite
    var tabContainers = document.querySelectorAll(".tab-nav")

    tabContainers.forEach(function (tabContainer) {
        var buttons = tabContainer.querySelectorAll(".tab-links")

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var target = this.getAttribute("data-target")
                var tabContentParent = tabContainer.parentNode

                // Finde alle Tabinhalte innerhalb des aktuellen Tabsatzes
                var tabContents = tabContentParent.querySelectorAll(".tab-content")

                // Entferne die aktive Klasse von allen Buttons und Inhalten des aktuellen Tabsatzes
                buttons.forEach(function (btn) { btn.classList.remove("active"); })
                tabContents.forEach(function (content) { content.classList.remove("active") })

                // Aktiviere den ausgewählten Tab und Inhalt
                this.classList.add("active")
                tabContentParent.querySelector("#" + target).classList.add("active")
            });
        });
    });
});