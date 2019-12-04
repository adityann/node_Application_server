function Actor(name, roles) {
    this.name = name;
    this.roles = roles;
    this.getRoles = function() {
      return `${this.name} is acting the roles of: ${this.roles}`;
    }
  };
  
  const harryPorter = new Actor('Harry Porter', ['Starring', 'Director']);
  console.log(harryPorter);
  
  const jackieChan = new Actor('Jackie Chan', ['Starring']);
  console.log(jackieChan);