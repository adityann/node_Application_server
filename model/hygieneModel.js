class Hygiene {
    constructor(washTemp, preWashTemp, rinseTemp, detergentConcentration) {
        this.washTemp = Number(washTemp) || 0;
        this.preWashTemp = Number(preWashTemp) || 0;
        this.rinseTemp = Number(rinseTemp) || 0;
        this.detergentConcentration = Number(detergentConcentration) || 0;
    }
}
module.exports = Hygiene;