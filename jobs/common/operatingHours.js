module.exports.hours = {
    sunday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    monday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    tuesday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    wednesday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    thursday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    friday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    },
    saturday: {
        closed: {type: Boolean, default: false},
        timings: [{
            open: {
                hr: {type: Number},
                min: {type: Number}
            },
            close: {
                hr: {type: Number},
                min: {type: Number}
            }
        }]
    }
}

module.exports.voucher_hours = {
    sunday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    monday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    tuesday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    wednesday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    thursday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    friday: {
        closed: {type: Boolean, default: false},
        timings: []
    },
    saturday: {
        closed: {type: Boolean, default: false},
        timings: []
    }
}