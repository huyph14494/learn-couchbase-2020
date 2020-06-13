const Express = require('express');
const Couchbase = require('couchbase');
const ExpressGraphQL = require('express-graphql');
const BuildSchema = require('graphql').buildSchema;
const UUID = require('uuid');

let app = Express();

const BUCKET_NAME = 'tab1';
let cluster = new Couchbase.Cluster('couchbase://127.0.0.1', {
	username: 'huy',
	password: '123456'
});
let bucket = cluster.bucket(BUCKET_NAME);
let collection = bucket.defaultCollection();

let schema = BuildSchema(`
  type Query {
    accounts: [Account],
    account(id: String!): Account,
    blogs(account: String!): [Blog],
    blog(id: String!): Blog
  }
  type Account {
    id: String,
    name: String,
  }
  type Blog {
    id: String,
    account: String!,
    title: String,
    content: String
  }
  type Mutation {
    createAccount(name: String!) : Account
    createBlog(account: String!, title: String!, content: String!): Blog
  }
`);

let resovlers = {
	accounts: () => {
		let statement = `
      SELECT META(account).id, account.* 
      FROM ${BUCKET_NAME} AS account
      WHERE account.type = 'account'
    `;

		return new Promise(async (resolve, reject) => {
			try {
				let result = await cluster.query(statement);
				console.log(result.rows);
				resolve(result.rows);
			} catch (error) {
				reject(error);
			}
		});
	},
	account: (data) => {
		let id = data.id;
		return new Promise((resolve, reject) => {
			collection.get(id, (error, result) => {
				if (error) {
					reject(error);
        }
        result.value.id = id;
				resolve(result.value);
			});
		});
	},
	createAccount: (data) => {
		let id = UUID.v4();
		data.type = 'account';
		return new Promise((resolve, reject) => {
			collection.insert(id, data, (error, result) => {
				if (error) {
					reject(error);
				}
				// resolve(result.value);
				collection.get(id, (error, result) => {
					if (error) {
						reject(error);
					}
					result.value.id = id;
					resolve(result.value);
				});
			});
		});
	},
	createBlog: (data) => {
		let id = UUID.v4();
		data.type = 'blog';
		return new Promise((resolve, reject) => {
			collection.insert(id, data, (error, result) => {
				if (error) {
					reject(error);
				}
				collection.get(id, (error, result) => {
					if (error) {
						reject(error);
          }
          result.value.id = id;
					resolve(result.value);
				});
			});
		});
	},
	blogs: (data) => {
		let statement = `
      SELECT META(blog).id, blog.* 
      FROM ${BUCKET_NAME} AS blog 
      WHERE blog.type = "blog" AND blog.account = "${data.account}"
    `;
		return new Promise(async (resolve, reject) => {
      try {
				let result = await cluster.query(statement);
				console.log(result.rows);
				resolve(result.rows);
			} catch (error) {
        console.log(error);
				reject(error);
			}
		});
	},
	blog: (data) => {
		let id = data.id;
		return new Promise((resolve, reject) => {
			collection.get(id, (error, result) => {
				if (error) {
					reject(error);
				}
				result.value.id = id;
				resolve(result.value);
			});
		});
	}
};

app.use(
	'/graphql',
	ExpressGraphQL({
		schema,
		rootValue: resovlers,
		graphiql: true
	})
);

app.listen(3000, () => {
	console.log('listening.....!');
});
