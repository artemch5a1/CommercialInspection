<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = ['name'];
    protected $table = 'groups';

    public function users()
    {
        return $this->hasMany(User::class, 'id_group');
    }
}
