export const formatMillions = (val) => {
    if (val === undefined || val === null) return "0";
    if (val === 0) return "0";

    return val.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
};

export const formatCurrencyMillions = (val) => {
    if (val === undefined || val === null) return "$0";
    if (val === 0) return "$0";

    return "$" + val.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
};
