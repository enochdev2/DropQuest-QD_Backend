const Product = require("../models/product");

exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const productSent = await Product.findOne({
      _id: id,
    }).exec();
    res.send(productSent);
  } catch (error) {
    console.log(error);
  }
};

exports.list = async (req, res) => {
  try {
    const productSent = await Product.find({}).exec();

    res.send(productSent);
  } catch (error) {
    res.send("server error");
  }
};

exports.create = async (req, res) => {
  try {
    // const { name, detail, price } = req.body
    const productSent = await Product(req.body).save();

    res.send(productSent);
  } catch (error) {
    res.send("server error");
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const productSent = await Product.findOneAndUpdate(
      {
        _id: id,
      },
      req.body,
      { new: true }
    ).exec();
    res.send(productSent);
  } catch (error) {
    res.send("server error");
  }
};

exports.remove = async (req, res) => {
  try {
    const {id} = req.params
    const removeProduct = await Product.findOneAndDelete({
        _id: id
    }).exec()
    res.send(removeProduct);
  } catch (error) {
    res.send("server error");
  }
};
