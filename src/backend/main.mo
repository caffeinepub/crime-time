import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  type PlayerProgress = {
    currentCity : Nat;
    totalMoney : Nat;
    weaponIds : [Nat];
    health : Nat;
  };

  module PlayerProgress {
    public func compare(p1 : PlayerProgress, p2 : PlayerProgress) : Order.Order {
      Nat.compare(p1.totalMoney, p2.totalMoney);
    };
  };

  let playerData = Map.empty<Principal, PlayerProgress>();

  public shared ({ caller }) func saveGameProgress(currentCity : Nat, totalMoney : Nat, weaponIds : [Nat], health : Nat) : async () {
    let progress : PlayerProgress = {
      currentCity;
      totalMoney;
      weaponIds;
      health;
    };
    playerData.add(caller, progress);
  };

  public query ({ caller }) func loadGameProgress() : async PlayerProgress {
    switch (playerData.get(caller)) {
      case (null) { Runtime.trap("No saved progress found.") };
      case (?progress) { progress };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [PlayerProgress] {
    playerData.values().toArray().sort();
  };
};
