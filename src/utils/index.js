export const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
};

export const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};