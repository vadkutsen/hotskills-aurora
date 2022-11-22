// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("Plarform contract tests", function () {
  let Platform;
  let hardhatPlatform;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Platform = await ethers.getContractFactory("PlatformFactory");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hardhatPlatform = await Platform.deploy();
    const addTask = await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Hola, mundo!",
        description: "Test description",
        taskType: 0,
        reward: "100",
      },
      {
        value: 101,
      }
    );
    await addTask.wait();
  });

  it("Should add task", async function () {
    const oldBalance = await ethers.provider.getBalance(
      hardhatPlatform.address
    );
    const fees = await hardhatPlatform.totalFees();
    const addTask = await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Hola, mundo!",
        description: "Test description",
        taskType: 0,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    expect(addTask);
    const tasks = await hardhatPlatform.getAllTasks();
    expect(tasks.length).to.equal(2);
    expect(await ethers.provider.getBalance(hardhatPlatform.address)).to.equal(
      parseInt(oldBalance) + 101
    );
    expect(await hardhatPlatform.totalFees()).to.equal(parseInt(fees) + 1);
  });

  it("Cannot add task with invalid amount", async function () {
    await expect(
      hardhatPlatform.connect(addr1).addTask(
        {
          title: "Hola, mundo!",
          description: "Test description",
          taskType: 0,
          reward: 100,
        },
        {
          value: 100,
        }
      )
    ).to.be.revertedWith("Wrong amount submitted");
  });

  it("Should get task", async function () {
    const task = await hardhatPlatform.getTask(1);
    expect(task.title).to.equal("Hola, mundo!");
    expect(task.description).to.equal("Test description");
    expect(task.status).to.equal(0);
  });

  it("Should apply for FCFS task", async function () {
    const applyForTask = await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    expect(applyForTask);
    const task = await hardhatPlatform.getTask(1);
    expect(task.assignee).to.equal(addr2.address);
    expect(task.status).to.equal(1);
  });

  it("Should apply for AuthorSelected task", async function () {
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Author Selected Porject",
        description: "Test description",
        taskType: 1,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    const applyForTask = await hardhatPlatform
      .connect(addr2)
      .applyForTask(2);
    expect(applyForTask);
    const task = await hardhatPlatform.getTask(2);
    expect(task.candidates.length).to.equal(1);
    expect(task.status).to.equal(0);
  });

  it("Cannot assign task if address didn't apply", async function () {
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Hola, mundo!",
        description: "Test description",
        taskType: 1,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    await expect(
      hardhatPlatform.connect(addr1).assignTask(2, addr2.address)
    ).to.be.revertedWith("Invalid address.");
  });

  it("Should assign task", async function () {
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Hola, mundo!",
        description: "Test description",
        taskType: 1,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    await hardhatPlatform.connect(addr2).applyForTask(2);
    const assignTask = await hardhatPlatform
      .connect(addr1)
      .assignTask(2, addr2.address);
    expect(assignTask);
    const task = await hardhatPlatform.getTask(2);
    expect(task.assignee).to.equal(addr2.address);
    expect(task.status).to.equal(1);
  });

  it("Cannot unassign not assigned task", async function () {
    await expect(
      hardhatPlatform.connect(addr1).unassignTask(1)
    ).to.be.revertedWith("Task is not assigned.");
  });

  it("Should unassign task", async function () {
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Hola, mundo!",
        description: "Test description",
        taskType: 1,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    await hardhatPlatform.connect(addr2).applyForTask(2);
    const assignTask = await hardhatPlatform
      .connect(addr1)
      .assignTask(2, addr2.address);
    expect(assignTask);
    await hardhatPlatform.connect(addr1).unassignTask(2);
    const task = await hardhatPlatform.getTask(2);
    expect(task.assignee).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(task.status).to.equal(0);
  });

  it("Should submit result", async function () {
    await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    const task = await hardhatPlatform.getTask(1);
    expect(task.result).to.equal("result");
    expect(task.status).to.equal(2);
  });

  it("Should complete task", async function () {
    const oldPlatformBalance = await ethers.provider.getBalance(
      hardhatPlatform.address
    );
    await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    await hardhatPlatform.connect(addr1).completeTask(1, 5);
    const task = await hardhatPlatform.getTask(1);
    expect(task.completedAt).to.be.above(0);
    expect(task.status).to.equal(4);
    expect(await hardhatPlatform.getRating(addr2.address)).to.equal(5);
    expect(await ethers.provider.getBalance(hardhatPlatform.address)).to.equal(
      parseInt(oldPlatformBalance) - 100
    );
  });

  it("Should request payment", async function () {
    const oldPlatformBalance = await ethers.provider.getBalance(
      hardhatPlatform.address
    );
    await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    await network.provider.send("evm_increaseTime", [86400 * 10]);
    await network.provider.send("evm_mine");
    await hardhatPlatform.connect(addr2).requestPayment(1);
    const task = await hardhatPlatform.getTask(1);
    expect(task.completedAt).to.be.above(0);
    expect(task.status).to.equal(4);
    expect(await ethers.provider.getBalance(hardhatPlatform.address)).to.equal(
      parseInt(oldPlatformBalance) - 100
    );
  });

  it("Cannot request payment untill 10 days passed", async function () {
    await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    await network.provider.send("evm_increaseTime", [86400 * 9]);
    await network.provider.send("evm_mine");
    await expect(
      hardhatPlatform.connect(addr2).requestPayment(1)
    ).to.be.revertedWith("Need to wait 10 days.");
  });

  it("Should request change", async function () {
    await hardhatPlatform.connect(addr2).applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    const requestChange = await hardhatPlatform.connect(addr1).requestChange(1, "message");
    expect(requestChange);
    const task = await hardhatPlatform.getTask(1);
    expect(task.changeRequests.length).to.equal(1);
    expect(task.status).to.equal(3);
  });

  it("Cannot request change if not in review", async function () {
    await hardhatPlatform
      .connect(addr2)
      .applyForTask(1);
    await expect(hardhatPlatform
      .connect(addr1)
      .requestChange(1, "message")).to.be.revertedWith("Invalid status");
  });

  it("Cannot request change over the limit", async function () {
    await hardhatPlatform.connect(addr2).applyForTask(1);
    await hardhatPlatform.connect(addr2).submitResult(1, "result");
    for (let i = 0; i < 3; i++) {
      await hardhatPlatform
      .connect(addr1)
      .requestChange(1, "message");
      await hardhatPlatform.connect(addr2).submitResult(1, "result");
    }
    await expect(hardhatPlatform
      .connect(addr1)
      .requestChange(1, "message")).to.be.revertedWith("Limit exceeded");
  });

  it("Should delete task", async function () {
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Title 2",
        description: "Test description 2",
        taskType: 0,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    const oldBalance = await ethers.provider.getBalance(
      hardhatPlatform.address
    );
    await hardhatPlatform.connect(addr1).deleteTask(2);
    const allTask = await hardhatPlatform.getAllTasks();
    expect(allTasks.length).to.equal(1);
    await expect(hardhatPlatform.getTask(2)).to.be.revertedWith(
      "Task not found."
    );
    expect(await ethers.provider.getBalance(hardhatPlatform.address)).to.equal(
      parseInt(oldBalance) - 100
    );
    await hardhatPlatform.connect(addr1).addTask(
      {
        title: "Title 3",
        description: "Test description 3",
        taskType: 0,
        reward: 100,
      },
      {
        value: 101,
      }
    );
    await hardhatPlatform.connect(addr1).deleteTask(3);
    expect(allTasks.length).to.equal(1);
  });

  it("Should withdraw", async function () {
    const oldBalance = await ethers.provider.getBalance(
      hardhatPlatform.address
    );
    expect(await hardhatPlatform.totalFees()).to.equal(1);
    await hardhatPlatform.withdrawFees();
    expect(await hardhatPlatform.totalFees()).to.equal(0);
    expect(await ethers.provider.getBalance(hardhatPlatform.address)).to.equal(
      parseInt(oldBalance) - 1
    );
  });

  it("Should set the right owner", async function () {
    expect(await hardhatPlatform.owner()).to.equal(owner.address);
  });

  it("Should get platform fee", async function () {
    expect(await hardhatPlatform.platformFeePercentage()).to.equal(1);
  });

  it("Should set the right fee", async function () {
    await hardhatPlatform.setPlatformFee(2);
    expect(await hardhatPlatform.platformFeePercentage()).to.equal(2);
  });
});
