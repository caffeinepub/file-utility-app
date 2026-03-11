import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // --- Types ---
  type SubscriptionTier = { #free; #pro };
  type UserProfile = { name : Text; dailyUsesCount : Nat; lastUsedDate : Text };
  type UTRStatus = { #pending; #approved };
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
  type DailyUsageResponse = { count : Nat; date : Text };

  let adminPrincipal = Principal.fromText("s4myo-xkgcs-g3v6k-ebulj-irmjb-jkgr6-5mytx-gcqbz-a3qgn-fy7zr-yae");

  // --- Component State ---
  // Authorization system is persisted
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --- Persistent Store ---
  let subscriptionStore = Map.empty<Principal, SubscriptionTier>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let utrStore = Map.empty<Principal, UTRSubmission>();

  // --- User Profile Functions (component required) ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not AccessControl.isAdmin(accessControlState, caller) and caller != user) {
      Runtime.trap("Unauthorized: Only admins can access other profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --- Daily Usage Tracking ---
  public query ({ caller }) func getDailyUsage() : async ?(UserProfile, DailyUsageResponse) {
    userProfiles.get(caller).map(
      func(profile) {
        (profile, { count = profile.dailyUsesCount; date = profile.lastUsedDate });
      }
    );
  };

  public shared ({ caller }) func incrementDailyUsage(today : Text) : async DailyUsageResponse {
    let existingProfile = userProfiles.get(caller);
    let (currentCount, currentDate, currentName) = switch (existingProfile) {
      case (null) { (0, "", "UPI User") };
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
    { count = newCount; date = today };
  };

  public query ({ caller }) func getIsPro() : async Bool {
    switch (subscriptionStore.get(caller)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  // --- Subscription Functions ---
  public query ({ caller }) func getSubscription() : async SubscriptionTier {
    switch (subscriptionStore.get(caller)) {
      case (null) { #free };
      case (?tier) { tier };
    };
  };

  public query ({ caller }) func getUserSubscription(user : Principal) : async SubscriptionTier {
    switch (subscriptionStore.get(user)) {
      case (null) { #free };
      case (?tier) { tier };
    };
  };

  public shared ({ caller }) func subscribe(tier : SubscriptionTier) : async () {
    switch (tier) {
      case (#free) {
        Runtime.trap("Cannot downgrade to free tier via subscribe");
      };
      case (#pro) { subscriptionStore.add(caller, #pro) };
    };
  };

  public query ({ caller }) func isProUser(user : Principal) : async Bool {
    switch (subscriptionStore.get(user)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  public query ({ caller }) func isProCaller() : async Bool {
    switch (subscriptionStore.get(caller)) {
      case (?#pro) { true };
      case (_) { false };
    };
  };

  public query ({ caller }) func countSubscribers() : async Nat {
    let filtered = subscriptionStore.filter(
      func(_principal : Principal, tier : SubscriptionTier) : Bool {
        tier == #pro;
      }
    );
    filtered.size();
  };

  // --- UTR Universal Payment Integration (UPI)-based Verification ---
  public shared ({ caller }) func submitUTR(email : Text, utrId : Text) : async () {
    if (utrId.size() != 12 or not utrId.toArray().all(func(c) { c.toText() >= "0" and c.toText() <= "9" })) {
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
    if (caller != adminPrincipal) {
      Runtime.trap("Access denied. Admin only.");
    };
    let filtered = utrStore.toArray().filter(
      func((_principal, submission)) { submission.status == #pending }
    );
    filtered.map(func((_, submission)) { submission });
  };

  public shared ({ caller }) func approveUTR(principalToApprove : Principal) : async () {
    if (caller != adminPrincipal) {
      Runtime.trap("Access denied. Admin only.");
    };
    switch (utrStore.get(principalToApprove)) {
      case (null) { Runtime.trap("No pending verification found for this principal.") };
      case (?submission) {
        if (submission.status == #approved) {
          Runtime.trap("This UTR has already been approved");
        } else {
          let updatedSubmission = { submission with status = #approved };
          utrStore.add(principalToApprove, updatedSubmission);
          subscriptionStore.add(principalToApprove, #pro);
        };
      };
    };
  };

  public query ({ caller }) func getMyVerificationStatus() : async UTRVerificationStatus {
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
};
