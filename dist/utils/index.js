"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.generateRandomId = exports.formatDate = void 0;
const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
};
exports.generateRandomId = generateRandomId;
const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};
exports.isEmpty = isEmpty;
