// Banner Component 
const StoreTemplate = document.createElement('template');
StoreTemplate.innerHTML = `
    <link rel="stylesheet" href="../css/store-component.css" />

    <div class="row store-info">
        <div class="col-md-12 col-sm-6 col-12">
            <div class="store-image">
                <img src="" class="img-fluid" alt="x" />
            </div>
        </div>

        <div class="col-md-12 col-sm-6 col-12">
            <div class="store-address">
                <p class="title">
                    <strong></strong>
                    <a href="#"></a>
                </p>
            </div>
            <div class="store-cta">
                <button class="btn button__primary">
                </button>
            </div>
        </div>
    </div>`;

class StoreInfo extends HTMLElement{
    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(StoreTemplate.content.cloneNode(true));
        this.shadowRoot.querySelector(".store-image img").src = this.getAttribute("storeImage");
        // this.shadowRoot.querySelector(".store-image img alt"). = this.getAttribute("storeImage");
        this.shadowRoot.querySelector(".title strong").innerText = this.getAttribute("storeTitle");
        this.shadowRoot.querySelector(".title a").innerText = this.getAttribute("storeChangeText");
        this.shadowRoot.querySelector(".title a").href = this.getAttribute("storeChangeLink");

        let addressLineOne = document.createElement("p");
        addressLineOne.innerText= this.getAttribute("addressLineOne");
        this.shadowRoot.querySelector(".store-address").appendChild(addressLineOne);

        let addressLineTwo = document.createElement("p");
        addressLineTwo.innerText= this.getAttribute("addressLineTwo");
        this.shadowRoot.querySelector(".store-address").appendChild(addressLineTwo);

        let phoneNo = document.createElement("a");
        phoneNo.setAttribute("href", `tel:${this.getAttribute("phoneNo")}`);
        phoneNo.innerText = this.getAttribute("phoneNo");
        this.shadowRoot.querySelector(".store-address").appendChild(phoneNo);

        this.shadowRoot.querySelector(".store-cta button").innerText = this.getAttribute("btnText");
    }
}

customElements.define("store-info", StoreInfo);