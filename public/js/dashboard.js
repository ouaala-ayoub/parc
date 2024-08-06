document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar .entry");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      // event.preventDefault();
      // Remove 'active' class from all links
      sidebarLinks.forEach((link) => link.classList.remove("active"));

      // Add 'active' class to the clicked link
      this.classList.add("active");

      // Update the content based on the clicked link (optional)
      // You can customize this part based on your requirement
      const content = document.querySelector(".content");
      content.innerHTML = `<h1>${this.textContent.trim()}</h1>`;
    });
  });
});
