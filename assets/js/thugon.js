document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleButton");
  const highlightContent = document.getElementById("highlightContent");

  toggleButton.addEventListener("click", function () {
    if (highlightContent.classList.contains("expanded")) {
      highlightContent.classList.remove("expanded");
      toggleButton.textContent = "XEM THÊM";
    } else {
      highlightContent.classList.add("expanded");
      toggleButton.textContent = "THU GỌN";
    }
  });
});