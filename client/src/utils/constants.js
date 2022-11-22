import abi from "./contractABI.json";

export const contractAddress = "0xaD53f2EB80b0205675F445F4F524d3dF69f79eb9";
export const contractABI = abi.abi;

export const address0 = "0x0000000000000000000000000000000000000000";

export const TaskTypes = {
  0: "First Come First Serve",
  1: "Selected by Author",
};

export const TaskStatuses = {
  0: "Active",
  1: "Assigned",
  2: "In Review",
  3: "Change Requested",
  4: "Completed",
};

export const ServiceStatuses = {
  0: "Active",
  1: "Paused",
};

export const Categories = [
  "Programming & Tech",
  "Writing & Translation",
  "Video & Animation",
  "Music & Audio",
  "Data",
  "Business",
  "Lifestyle",
  "Other",
];

