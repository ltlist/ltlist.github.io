let data = JSON.parse(localStorage.getItem("admin_data") || "[]");

const list = document.getElementById("list");

// render
function render() {
    list.innerHTML = "";

    data.forEach((f, i) => {
        list.innerHTML += `
        <tr>
            <td>${f.nama}</td>
            <td>${f.koin}</td>
            <td>
                <button onclick="hapus(${i})">❌</button>
            </td>
        </tr>
        `;
    });

    localStorage.setItem("admin_data", JSON.stringify(data));
}

function addFaucet() {
    data.push({
        id: Date.now().toString(),
        nama: nama.value,
        koin: koin.value,
        trust: trust.value,
        reward: reward.value,
        link: link.value,
        cooldown: parseInt(cooldown.value)
    });

    render();
}

function hapus(i) {
    data.splice(i, 1);
    render();
}

// export JSON untuk GitHub
function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "faucet.json";
    a.click();
}

render();