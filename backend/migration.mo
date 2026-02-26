module {
  type OldActor = {
    adminPrincipal : ?Principal;
  };

  type NewActor = {};

  public func run(old : OldActor) : NewActor {
    {};
  };
};
