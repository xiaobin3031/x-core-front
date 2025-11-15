// message.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./css/message.css";

let root = null;
let list = [];
let id = 0;

function ensureRoot() {
    if (!root) {
        const div = document.createElement("div");
        div.id = "global-message-container";
        document.body.appendChild(div);
        root = ReactDOM.createRoot(div);
    }
}

function render() {
    ensureRoot();
    root.render(
        <div id="global-message-container">
            {list.map((msg) => (
                <div key={msg.id} className={`msg-item ${msg.fade ? "fade" : ""} ${msg.type}`} onClick={() => remove(msg.id)}>
                    {msg.text}
                </div>
            ))}
        </div>
    );
}

function remove(id) {
    const index = list.findIndex((m) => m.id === id);
    if (index < 0) return;

    list[index].fade = true;
    render();

    setTimeout(() => {
        list.splice(index, 1);
        render();
    }, 300);
}

function pushMessage({type, msg, duration = 2000}) {
    ensureRoot();

    const item = { id: id++, text: msg, fade: false, type};

    // 最新的在最上
    list.unshift(item);

    // 最多同时 5 条
    if (list.length > 5) {
        list.pop();
    }

    render();

    setTimeout(() => remove(item.id), duration);
}

export default {
    info: (...args) => {
        pushMessage(Object.assign({}, ...args, { type: "info" }))
    },
    success: (...args) => {
        pushMessage(Object.assign({}, ...args, { type: "success" }))
    },
    error: (...args) => {
        pushMessage(Object.assign({}, ...args, { type: "error", duration: 4000 }))
    },
    warning: (...args) => {
        pushMessage(Object.assign({}, ...args, { type: "warning" }))
    }
};