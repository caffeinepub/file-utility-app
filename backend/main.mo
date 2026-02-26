import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type SubscriptionTier = {
    #free;
    #pro;
  };

  type UserProfile = {
    name : Text;
    dailyUsesCount : Nat;
    lastUsedDate : Text;
  };

  type UTRStatus = {
    #pending;
    #approved;
  };

  type UTRSubmission = {
    principal : Principal;
    email : Text;
    utrId : Text;
    submittedAt : Int;
    status : UTRStatus;
  };

  type UTRVerificationStatus = {
    #pending;
    #approved;
    #notSubmitted;
  };

  type DailyUsageResponse = {
    count : Nat;
    date : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let subscriptionStore = Map.empty<Principal, SubscriptionTier>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let utrStore = Map.empty<Principal, UTRSubmission>();

  // --- User Profile Functions (required by frontend) ---

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --- Daily Usage Tracking ---

  public query ({ caller }) func getDailyUsage() : async DailyUsageResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (userProfiles.get(caller)) {
      case (null) {
        // No profile yet: return zero usage
        { count = 0; date = "" };
      };
      case (?profile) {
        {
          count = profile.dailyUsesCount;
          date = profile.lastUsedDate;
        };
      };
    };
  };

  public shared ({ caller }) func incrementDailyUsage(today : Text) : async DailyUsageResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let existingProfile = userProfiles.get(caller);
    let (currentCount, currentDate, currentName) = switch (existingProfile) {
      case (null) { (0, "", "") };
      case (?profile) { (profile.dailyUsesCount, profile.lastUsedDate, profile.name) };
    };
    let isNewDay = currentDate != today;
    let baseCount : Nat = if (isNewDay) { 0 } else { currentCount };
    let newCount = baseCount + 1;
    let updatedProfile : UserProfile = {
      name = currentName;
      dailyUsesCount = newCount;
      lastUsedDate = today;
    };
    userProfiles.add(caller, updatedProfile);
    {
      count = newCount;
      date = today;
    };
  };

  public query ({ caller }) func getIsPro() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (subscriptionStore.get(caller)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  // --- Subscription Functions ---

  public query ({ caller }) func getSubscription() : async SubscriptionTier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (subscriptionStore.get(caller)) {
      case (null) { #free };
      case (?tier) { tier };
    };
  };

  public query ({ caller }) func getUserSubscription(user : Principal) : async SubscriptionTier {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own subscription");
    };
    switch (subscriptionStore.get(user)) {
      case (null) { #free };
      case (?tier) { tier };
    };
  };

  public shared ({ caller }) func subscribe(tier : SubscriptionTier) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (tier) {
      case (#free) {
        Runtime.trap("Cannot downgrade to free tier via subscribe");
      };
      case (#pro) {
        subscriptionStore.add(caller, #pro);
      };
    };
  };

  public query ({ caller }) func isProUser(user : Principal) : async Bool {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own subscription status");
    };
    switch (subscriptionStore.get(user)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  public query ({ caller }) func isProCaller() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (subscriptionStore.get(caller)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  public query ({ caller }) func countSubscribers() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can count subscribers");
    };
    let filtered = subscriptionStore.filter(
      func(_principal : Principal, tier : SubscriptionTier) : Bool {
        tier == #pro;
      }
    );
    filtered.size();
  };

  // --- UTR Universal Payment Integration (UPI)-based Verification ---

  public shared ({ caller }) func submitUTR(email : Text, utrId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    if (utrId.size() != 12 or not utrId.toArray().all(Char.isDigit)) {
      Runtime.trap("Invalid UTR - must be 12 digit number");
    };
    let submission = {
      principal = caller;
      email;
      utrId;
      submittedAt = Time.now();
      status = #pending;
    };
    utrStore.add(caller, submission);
  };

  public query ({ caller }) func getPendingVerifications() : async [UTRSubmission] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending verifications");
    };
    let filtered = utrStore.toArray().filter(
      func((_principal, submission)) { submission.status == #pending }
    );
    filtered.map(
      func((_, submission)) { submission }
    );
  };

  public shared ({ caller }) func approveUTR(principalToApprove : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve UTR verifications");
    };
    switch (utrStore.get(principalToApprove)) {
      case (null) {
        Runtime.trap("No pending verification found for this principal.");
      };
      case (?submission) {
        if (submission.status == #approved) {
          Runtime.trap("This UTR has already been approved");
        };
        let updatedSubmission = { submission with status = #approved };
        utrStore.add(principalToApprove, updatedSubmission);
        subscriptionStore.add(principalToApprove, #pro);
      };
    };
  };

  public query ({ caller }) func getMyVerificationStatus() : async UTRVerificationStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    switch (utrStore.get(caller)) {
      case (null) { #notSubmitted };
      case (?submission) {
        switch (submission.status) {
          case (#pending) { #pending };
          case (#approved) { #approved };
        };
      };
    };
  };

  public shared ({ caller }) func batchApproveUTRs() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can batch approve UTR verifications");
    };
    for ((principal, submission) in utrStore.entries()) {
      if (submission.status == #pending) {
        let updatedSubmission = { submission with status = #approved };
        utrStore.add(principal, updatedSubmission);
        subscriptionStore.add(principal, #pro);
      };
    };
  };
};
