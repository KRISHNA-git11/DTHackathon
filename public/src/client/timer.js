class Timer {
    constructor () {
      this.isRunning = false;
      this.startTime = 0;
      this.totalTime = 0;
    }
  
    _elapsedTime () {
      if (!this.startTime) {
        return 0;
      }
      return Date.now() - this.startTime;
    }
  
    start (time=0) {
      if (this.isRunning) {
        return console.error('Timer is already running');
      }
      this.isRunning = true;
      this.totalTime = time;
      this.startTime = (Date.now());
    }
    
    stop () {
      this.isRunning = false;
      this.totalTime = this.totalTime + this._elapsedTime();
    }
  
    reset () {
      this.totalTime = 0;
      if (this.isRunning) {
        this.startTime = Date.now();
        return;
      }
      this.startTime = 0;
    }
  
    getTime () {
      if (!this.startTime) {
        return 0;
      }
      if (this.isRunning) {
        return this.totalTime + this._elapsedTime();
      }
      return this.totalTime;
    }
  }
  