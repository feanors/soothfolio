
document.getElementById('add-button').addEventListener('click', function () {
    document.getElementById("control-div").classList.add("hidden");
    document.getElementById("add-form").classList.remove("hidden");
    document.getElementsByClassName("table")[0].classList.add("hidden");

})


document.getElementById('remove-button').addEventListener('click', function () {
    document.getElementById("control-div").classList.add("hidden");
    document.getElementById("remove-form").classList.remove("hidden");
    document.getElementsByClassName("table")[0].classList.add("hidden");

})

document.getElementById("close-add-form").addEventListener("click", function() {
    document.getElementById("control-div").classList.remove("hidden");
    document.getElementById("add-form").classList.add("hidden");
    document.getElementsByClassName("table")[0].classList.remove("hidden");
}) 

document.getElementById("close-remove-form").addEventListener("click", function() {
    document.getElementById("control-div").classList.remove("hidden");
    document.getElementById("remove-form").classList.add("hidden");
    document.getElementsByClassName("table")[0].classList.remove("hidden");
}) 