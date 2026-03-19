"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IndexController {
    handleGetRequest(_req, res) {
        res.send('GET request handled');
    }
    handlePostRequest(_req, res) {
        res.send('POST request handled');
    }
}
exports.default = IndexController;
