import random 
value = random.randint(0,4999)
with open('message.txt') as f:
    count = 0
    for line in f:
        if str(value) in line:
            count+=1
            print(line)

print(120000/(count))