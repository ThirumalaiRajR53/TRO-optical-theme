async function updateCartItemCounts() {
  const cartBubbleHtmlResponse = await fetch("/?section_id=cart-icon-bubble");
  const cartBubbleTextResponse = await cartBubbleHtmlResponse.text();
  const cartBubbleWrapper = document.createElement("div");
  cartBubbleWrapper.innerHTML = cartBubbleTextResponse;

  const updatedCartBubble = cartBubbleWrapper.querySelector(".cart-count-bubble").innerHTML;

  document.querySelector(".cart-count-bubble").innerHTML = updatedCartBubble;

  addCartListeners();
}

async function updateCartPage() {
  const cartPageHtmlResponse = await fetch("/?section_id=main-cart");
  const cartPageResponseText = await cartPageHtmlResponse.text();
  const cartPageWrapper = document.createElement("div");
  cartPageWrapper.innerHTML = cartPageResponseText;

  const updatedCartPage = cartPageWrapper.querySelector(".cart-page").innerHTML;

  document.querySelector(".cart-page").innerHTML = updatedCartPage;

  addCartListeners();
}

async function updateCartDrawer() {
  const cartDrawerHtmlResponse = await fetch("/?section_id=cart-drawer");
  const cartDrawerResponseText = await cartDrawerHtmlResponse.text();
  const cartDrawerWrapper = document.createElement("div");
  cartDrawerWrapper.innerHTML = cartDrawerResponseText;

  const updatedDrawerContent = cartDrawerWrapper.querySelector(".drawer").innerHTML;

  document.querySelector(".drawer").innerHTML = updatedDrawerContent;

  addCartListeners();
}

function addCartListeners() {
  // Update quantities
  const allCartItems = document.querySelectorAll(".cart-page-item");
  allCartItems.forEach((item) => {
    item.querySelectorAll(".cart-quantity button").forEach((button) => {
      button.addEventListener("click", async () => {
        const key = item.getAttribute("data-line-item-key");
        const newQuantity = Number(item.querySelector("input").value);
        // Ajax update\
        const cartUpdateResponse = await fetch("/cart/change.js", {
          method: "post",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: key, quantity: newQuantity }),
        });
        const cart = await cartUpdateResponse.json();

        if (cart.message) {
          const lineItemError = document.getElementById(`Line-item-error-${line}`);
          if (lineItemError) lineItemError.querySelector(".cart-item__error-text").innerHTML = cart.message;
        }

        updateCartItemCounts();

        // Update cart
        updateCartDrawer();
        updateCartPage();
      });
    });
  });
}

addCartListeners();
