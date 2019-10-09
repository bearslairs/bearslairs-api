# bearslairs-api
## a nodejs interface to a mongodb
### installation
#### fedora, redhat, centos ([mongodb docs](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/))

create `/etc/yum.repos.d/mongodb-org-4.2.repo`, containing:
```
[mongodb-org-4.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.2.asc
```
install compass and mongodb:
```bash
sudo dnf install -y mongodb-org https://downloads.mongodb.com/compass/mongodb-compass-1.19.12.x86_64.rpm
```
configure mongodb replication, required for changestream event subscriptions ([mongodb docs](https://docs.mongodb.com/manual/reference/configuration-options/#replication.replSetName)). edit `/etc/mongod.conf` to include a replication set name:
```
replication:
  replSetName: rs0
```
enable and start the mongod service:
```bash
sudo systemctl enable mongod.service
sudo systemctl start mongod.service
```
configure the replset ([replset tut](https://devops.ionos.com/tutorials/configure-mongodb-replica-set/)):
```
mongo
rs.initiate()
rs.conf()
```
at this stage, the mongo shell prompt should also indicate the replica name and replica member role. for example:
```
rs0:PRIMARY>
```
