var express = require("express");
var app = express();
var port = 3000;


var MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017/animals', { useUnifiedTopology: true }, async function (err, client) {
  if (err) throw err

  var db = client.db('publish')
  var authorCollection = db.collection('authors')

  await authorCollection.deleteMany()
  authorCollection.insertMany(
    [{
      name: 'Abilash',
      awards: [
        {
          name: 'award1',
          year: 2000,
        },
        {
          name: 'award2',
          year: 2000,
        }],
      dob: new Date('10/01/1993'),
      books: [{
        name: 'Abibook1',
        price: 10,
        sold: 2
      },
      {
        name: 'Abibook2',
        price: 10,
        sold: 1
      }]

    },
    {
      name: 'R S Aggrawal',
      awards: [
        {
          name: 'award1',
          year: 2000,
        },
        {
          name: 'award2',
          year: 2000,
        }],
      dob: new Date('10/01/1990'),
      books: [{
        name: 'RSbook1',
        price: 10,
        sold: 4
      },
      {
        name: 'RSbook2',
        price: 10,
        sold: 5
      }]

    }
    ]
  )

  app.get("/authors", async (req, res) => {
    let { type, awardNumbers, awardedYear, dob, totalPrice } = req.query
    console.log(req.query)
    awardedYear = parseInt(awardedYear, 10)
    totalPrice = parseInt(totalPrice, 10)
    dob = new Date(dob)
    let output
    switch (type) {
      case 'awards':
        output = await authorCollection.find({ $where: `this.awards.length>${awardNumbers}` }).toArray()
        break;
      case 'awardYears':
        output = await authorCollection.find({ "awards.year": { $gt: awardedYear } }).toArray()
        //  we can use $year if we save Date for time saving i saved year as number
        break;

      case 'totalBooksAndProfit':
        output = await authorCollection.aggregate(
          [
            {
              $project: {
                totalBooksSold: { $sum: "$books.sold" },
                totalProfit: {
                  $sum: {
                    $map: {
                      input: "$books",
                      as: "book",
                      in: { $multiply: ["$$book.sold", "$$book.price"] }
                    }
                  }
                }
              }
            }
          ]

        ).toArray()
        break;

      case 'ageAndTotalPrice':
        output = await authorCollection.aggregate([
          {
            $addFields: {
              totalPrice: { $sum: "$books.price" },
            }
          },
          {
            $match: {
              totalPrice: { $gte: totalPrice },
              dob: { $gte: dob }
            }
          }, {
            $project: {
              totalPrice: 1
            }
          }
        ]).toArray()
        break;
      default:
        output = "invalid input"
        break;
    }

    res.send({ output })
  });

  app.listen(port, () => {
    console.log("Server listening on port " + port);
  });
})

